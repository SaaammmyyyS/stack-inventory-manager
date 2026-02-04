FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY saas-manager/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Daws.region=ap-southeast-1", "-Xmx512m", "-jar", "app.jar"]