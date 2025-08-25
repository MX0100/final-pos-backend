## Final POS Backend (NestJS)

A TypeScript backend implementing Products and Carts with stock reservations, optimistic locking, and cart auto-expiry. Built with NestJS, TypeORM, and PostgreSQL. API is documented via Swagger and versioned under `/api/v1`.

### Features

- Products CRUD with optimistic stock adjustments
- Carts with add/overwrite item operations and single-quantity updates
- Stock reservation/release coordinated with cart mutations
- 15-minute cart auto-expiry job; expired carts are marked (not deleted) for analytics; deletion releases stock
- Decoupled product operations via DI token (`PRODUCT_SERVICE`), defaulting to an HTTP client using the generated API client under `src/generated`
- Global HTTP logging interceptor, input validation, security headers, and response compression

### Architecture

- Modules: `products`, `carts`, and cross-cutting `common` (interceptors)
- Persistence: PostgreSQL + TypeORM (entities auto-loaded; sync enabled for development)
- API Versioning: URI-based (`/api/v1`)
- Swagger API docs are available at `/api/docs` when running the app.
- Observability/Security: global HTTP logging interceptor, Helmet, and compression
- Generated Client: `src/generated/products` consumed by `carts` via `HttpProductService`

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development only)

### Environment Variables

The following environment variables are configured in `docker-compose.yaml`:

- `PORT` (default: `3000`)
- `DB_HOST` (default: `postgres` in Docker, `localhost` for local dev)
- `DB_PORT` (default: `5432`)
- `DB_USER` (default: `postgres`)
- `DB_PASS` (default: `postgres` in Docker)
- `DB_NAME` (default: `final_pos`)
- `PRODUCTS_API_BASE` (default: `http://localhost:3000`) – used by carts to call products API
- `CARTS_API_BASE` (default: `http://localhost:3000`) – used by products to call carts internal cleanup
- `CART_EXPIRY_JOBS=disabled` – disables the scheduled cart expiry processing

### Quick Start with Docker

```bash
# Start the application with PostgreSQL
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f backend
```

API docs: visit `http://localhost:3000/api/docs`.

### Local Development

```bash
# Install dependencies
npm install

# Start with local PostgreSQL
npm run start:dev

# Or use Docker for database only
docker-compose up postgres -d
npm run start:dev
```

### Testing

```bash
# Unit tests (local)
npm run test

# E2E tests (Docker)
npm run test:e2e

# E2E tests with specific test
npm run test:e2e:all

# Unit tests in Docker
npm run test:unit

# Coverage (local)
npm run test:cov
```

### Regenerate OpenAPI Client

This project includes a generated Products API client under `src/generated/products`.
If the OpenAPI spec changes, regenerate with:

```bash
npx @openapitools/openapi-generator-cli generate -c openapitools.json
```

### Database

TypeORM is configured with `synchronize: true` for development. See the detailed schema and relations in `DATABASE-SCHEMA.md`.

### Operational Notes

- Auto-expiry is executed every 15 minutes; set `CART_EXPIRY_JOBS=disabled` to turn it off
- Deleting a cart releases reserved stock immediately
- Expired carts are kept for behavior analytics, with stock released

### License

UNLICENSED (private project)
