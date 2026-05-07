# syntax=docker/dockerfile:1.6
# =====================================================================
#  Angular 19 frontend (daxa) — multi-stage build
#  Stage 1 : install + ng build
#  Stage 2 : nginx:alpine serves the compiled assets and reverse-proxies
#            /api/* to the API gateway running inside the K8s cluster.
# =====================================================================

# ---------- Stage 1 : build ----------
FROM node:20-alpine AS build
WORKDIR /app

ENV NG_CLI_ANALYTICS=ci \
    CI=true

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Production-grade build (outputs to /app/dist/daxa/browser when SSR is enabled).
RUN npx ng build --configuration production

# ---------- Stage 2 : runtime (nginx) ----------
FROM nginx:1.27-alpine

RUN rm -rf /usr/share/nginx/html/* \
 && apk add --no-cache curl

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Angular Application Builder layout is dist/<project>/browser
COPY --from=build /app/dist/daxa/browser/ /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=4s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
