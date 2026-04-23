# ============================================
# STAGE 1: Build with Maven
# ============================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Copy everything
COPY . .

# Build JAR (skip tests completely)
RUN mvn clean package -DskipTests -Dmaven.test.skip=true -B

# ============================================
# STAGE 2: Runtime with JRE
# ============================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
