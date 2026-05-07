FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/microservice_project.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
