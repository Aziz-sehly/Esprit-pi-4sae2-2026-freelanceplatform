package com.prolance.gateway.config;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.Collections;
import java.util.stream.Collectors;

@Component
public class JwtHeaderRelayFilter implements GlobalFilter, Ordered {

    @Override
    public int getOrder() {
        return -100;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return ReactiveSecurityContextHolder.getContext()
                .flatMap(ctx -> chain.filter(withHeaders(exchange, ctx.getAuthentication())))
                .switchIfEmpty(chain.filter(exchange));
    }

    private ServerWebExchange withHeaders(ServerWebExchange exchange, Authentication authentication) {
        if (!(authentication instanceof JwtAuthenticationToken jwtAuth)) {
            return exchange;
        }
        String userId = jwtAuth.getToken().getSubject();
        Collection<? extends GrantedAuthority> auths = jwtAuth.getAuthorities();
        if (auths == null) {
            auths = Collections.emptyList();
        }
        String roles = auths.stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a != null && !a.isBlank())
                .collect(Collectors.joining(","));
        // Ne pas utiliser ServerHttpRequest.Builder.header() : les en-têtes de la requête
        // entrante sont souvent ReadOnlyHttpHeaders et provoquent UnsupportedOperationException.
        ServerHttpRequest original = exchange.getRequest();
        ServerHttpRequest decorated = new ServerHttpRequestDecorator(original) {
            @Override
            public HttpHeaders getHeaders() {
                // Copie explicite : writableHttpHeaders(super.getHeaders()) peut encore renvoyer
                // une vue en lecture seule (ReactiveLoadBalancerClientFilter → RequestData lit getHeaders()).
                HttpHeaders copy = new HttpHeaders();
                copy.addAll(super.getHeaders());
                if (userId != null && !userId.isBlank()) {
                    copy.set("X-User-Id", userId);
                }
                if (!roles.isBlank()) {
                    copy.set("X-User-Roles", roles);
                }
                return copy;
            }
        };
        return exchange.mutate().request(decorated).build();
    }
}
