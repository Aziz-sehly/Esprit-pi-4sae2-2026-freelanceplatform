package com.prolance.gateway.config;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.OrderedGatewayFilter;
import org.springframework.cloud.gateway.filter.RouteToRequestUrlFilter;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;

import static org.springframework.cloud.gateway.support.ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR;
import static org.springframework.cloud.gateway.support.ServerWebExchangeUtils.addOriginalRequestUrl;

/**
 * Explicit path rewrite (no StripPrefix/PrefixPath / YAML placeholders).
 * <p>
 * The rewrite <strong>must</strong> run before {@link RouteToRequestUrlFilter} (order 10000);
 * otherwise {@code exchange.getRequest().getURI()} still has the public path when the load balancer
 * builds the downstream URL, and services receive the wrong path (e.g. {@code /users/admin/users}
 * instead of {@code /api/users/admin/users}).
 */
@Configuration
public class GatewayRoutesConfig {

    /**
     * Just below {@link RouteToRequestUrlFilter#ROUTE_TO_URL_FILTER_ORDER} so path + {@code lb://} merge correctly.
     */
    private static final int REWRITE_PATH_FILTER_ORDER = RouteToRequestUrlFilter.ROUTE_TO_URL_FILTER_ORDER - 10;

    @Bean
    public RouteLocator prolanceRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("message-service-route", r -> r
                        .path("/messages/**")
                        .filters(f -> f.filter(orderedRewrite("/messages", "/api/messages")))
                        .uri("lb://message-service"))
                .route("message-websocket-route", r -> r
                        .path("/ws/**")
                        .uri("lb://message-service"))
                .route("dispute-service-route", r -> r
                        .path("/disputes/**")
                        .filters(f -> f.filter(orderedRewrite("/disputes", "/api/disputes")))
                        .uri("lb://dispute-service"))
                .route("user-service-route", r -> r
                        .path("/users/**")
                        .filters(f -> f.filter(orderedRewrite("/users", "/api/users")))
                        .uri("lb://user-service"))
                .build();
    }

    private static GatewayFilter orderedRewrite(String publicPrefix, String apiPrefix) {
        return new OrderedGatewayFilter(rewritePublicPath(publicPrefix, apiPrefix), REWRITE_PATH_FILTER_ORDER);
    }

    /**
     * {@code /messages/users} + préfixe {@code /messages} → suffixe {@code /users} → cible {@code /api/messages/users}.
     */
    private static GatewayFilter rewritePublicPath(String publicPrefix, String apiPrefix) {
        return new GatewayFilter() {
            @Override
            public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
                ServerHttpRequest request = exchange.getRequest();
                addOriginalRequestUrl(exchange, request.getURI());
                String path = request.getURI().getRawPath();
                if (!path.startsWith(publicPrefix)) {
                    return chain.filter(exchange);
                }
                String tail = path.length() > publicPrefix.length()
                        ? path.substring(publicPrefix.length())
                        : "";
                String newPath = apiPrefix + tail;
                // Éviter request.mutate() : DefaultServerHttpRequestBuilder copie les en-têtes et peut
                // échouer si la requête est déjà décorée (ex. JwtHeaderRelayFilter / ReadOnlyHttpHeaders).
                URI rewritten = UriComponentsBuilder.fromUri(request.getURI()).replacePath(newPath).build(true).toUri();
                ServerHttpRequest newRequest = new ServerHttpRequestDecorator(request) {
                    @Override
                    public URI getURI() {
                        return rewritten;
                    }
                };
                exchange.getAttributes().put(GATEWAY_REQUEST_URL_ATTR, rewritten);
                return chain.filter(exchange.mutate().request(newRequest).build());
            }
        };
    }
}
