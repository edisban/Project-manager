# syntax=docker/dockerfile:1

# ---- Build -------------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace

# Resolve dependencies first so they are cached until pom.xml changes.
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn -B -q dependency:go-offline

COPY src ./src
# Tests run in CI (they need Docker for Testcontainers), not inside the image build.
RUN --mount=type=cache,target=/root/.m2 mvn -B -q package -DskipTests \
    && cp target/backendproject-*.jar app.jar

# ---- Runtime -----------------------------------------------------------------
FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /workspace/app.jar app.jar
USER app

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=6 \
  CMD wget -qO- http://127.0.0.1:8080/actuator/health/readiness > /dev/null || exit 1

# exec so the JVM is PID 1 and receives SIGTERM for graceful shutdown.
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
