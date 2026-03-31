# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
# Build (skip tests)
mvn clean package -DskipTests

# Run locally
mvn spring-boot:run

# Run all tests
mvn test

# Run a single test class
mvn test -Dtest=ContentOpsPlatformApplicationTests

# Run a single test method
mvn test -Dtest=ContentOpsPlatformApplicationTests#contextLoads
```

Default port: `8080`. H2 console available at `/h2-console` in dev profile.

## Architecture

Spring Boot 3 + Java 17 REST API. Single-module Maven project.

**Package layout:** `com.contentops`
- `content/` — feature module: `Content` (JPA entity), `ContentStatus` (enum), `ContentRepository` (Spring Data JPA), `ContentService`, `ContentController`
- `common/` — cross-cutting: `ApiResponse<T>` (unified response wrapper), `GlobalExceptionHandler` (centralized `@RestControllerAdvice`)

**Unified response contract:** All endpoints return `ApiResponse<T>`. Use `ApiResponse.success(data)` / `ApiResponse.error(message)` — never return raw types from controllers.

**Persistence:** Spring Data JPA with H2 (in-memory, dev). Schema auto-created from entities via `ddl-auto: create-drop`.

**Content lifecycle:** `ContentStatus` enum drives state transitions on the `Content` entity. Business rules enforced in `ContentService`, not the controller.
