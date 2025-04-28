FROM gradle:jdk21 AS builder

WORKDIR /workspace

COPY build.gradle* settings.gradle* ./
COPY gradlew ./
COPY gradle ./gradle/

RUN ./gradlew build --no-daemon || return 0

COPY src ./src

RUN ./gradlew bootJar --no-daemon

FROM openjdk:21-jdk-slim

WORKDIR /app
COPY --from=builder /workspace/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]