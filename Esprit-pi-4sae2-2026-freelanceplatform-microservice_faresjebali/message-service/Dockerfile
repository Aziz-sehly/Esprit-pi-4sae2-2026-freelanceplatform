# syntax=docker/dockerfile:1.6
# ---------- Stage 1 : build ----------
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace

COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn -B -q -DskipTests dependency:go-offline

COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -B -DskipTests package \
 && cp target/*.jar /workspace/app.jar

# ---------- Stage 2 : runtime ----------
FROM eclipse-temurin:17-jre-jammy

ENV TZ=UTC \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0" \
    SERVER_PORT=8099 \
    SPRING_PROFILES_ACTIVE=prod

RUN groupadd -r app && useradd -r -g app app \
 && mkdir -p /app/uploads && chown -R app:app /app
WORKDIR /app

COPY --from=build /workspace/app.jar /app/app.jar

USER app
EXPOSE 8099

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD wget -qO- http://localhost:8099/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]
