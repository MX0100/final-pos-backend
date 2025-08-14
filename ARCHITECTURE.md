# Final Shop Backend Architecture

## 1. Goals and Scope
- Provide a minimal, robust backend for a simple shop with product CRUD and a shopping cart.
- Enforce zero cohesion between NestJS modules: `products` and `carts` communicate only via HTTP.
- Ensure stock is updated correctly with crash-safe handling using DB transactions and compensation.
- Ship production-ready ergonomics: validation, Swagger, Docker, and environment-driven config.

## 2. High-Level Design
- Runtime: NestJS (TypeScript)
- Persistence: PostgreSQL via TypeORM
- Modules:
  - `products`: Owns product catalog and stock. Exposes CRUD and a stock-adjustment endpoint.
  - `carts`: Owns shopping carts and line items. Calls the `products` API to reserve/release stock.
- Inter-module communication: HTTP requests from `carts` to `products` using Nest `HttpModule`.
- API documentation: Swagger served at `/api/docs`.
- Validation: Global `ValidationPipe` with whitelist, non-whitelisted rejection, and value transformation.

## 3. Database Schema
- Table `products`
  - `id uuid` PK
  - `name varchar(64)` not null
  - `description varchar(2048)` null
  - `image text` Base64 data URL (<1MB enforced via validation)
  - `price numeric` stored as string in the entity to preserve precision
  - `stock int` default 0, cannot be negative by business logic
- Table `carts`
  - `id uuid` PK
  - `createdAt timestamptz`
  - `updatedAt timestamptz`
- Table `cart_items`
  - `id uuid` PK
  - `cartId uuid` FK -> `carts.id` on delete cascade
  - `productId uuid` opaque reference pointing to product in `products` module
  - `quantity int` not null
  - Unique constraint `(cartId, productId)`

## 4. Module Independence
- The `carts` module never imports any Nest provider from `products`.
- The `products` module exposes a narrow contract endpoint:
  - `POST /products/:id/adjust-stock/:delta` where `delta` can be positive or negative.
- The `carts` module uses this endpoint to reserve (negative delta) or release (positive delta) inventory.

## 5. Consistency and Crash Handling
- All cart mutations run inside PostgreSQL transactions via TypeORM `DataSource.transaction`.
- Saga-like compensation guards cross-module consistency:
  - Add item: reserve stock first via `products` API; then insert item in a transaction; if DB step fails, compensate by restoring stock.
  - Update quantity: compute `delta`; call `adjust-stock` first; if DB save fails, compensate by reversing the delta.
  - Remove item: delete item in a transaction, then call `adjust-stock` to restore stock; if HTTP call fails, the transaction throws and rolls back.
- This keeps system state consistent even if one side fails mid-operation.

## 6. Validation and Security
- Global `ValidationPipe` with:
  - `whitelist: true`, `forbidNonWhitelisted: true`
  - `transform: true` with implicit conversion
- Custom validator `IsDataUrlUnder1MB` enforces the image is a data URL under 1MB.
- Stock adjustments validated to prevent negative inventory.

## 7. API Summary
- Products
  - `POST /products` create
  - `GET /products` list
  - `GET /products/:id` get by id
  - `PATCH /products/:id` update
  - `DELETE /products/:id` delete
  - `POST /products/:id/adjust-stock/:delta` delta may be negative/positive integer
- Carts
  - `POST /carts` create cart
  - `GET /carts/:cartId` get cart with items
  - `DELETE /carts/:cartId` delete cart (restores all reserved stock)
  - `POST /carts/:cartId/items` add item (reserves stock)
  - `DELETE /carts/:cartId/items/:productId` remove item (releases stock)
  - `PATCH /carts/:cartId/items/:productId` update quantity (reserves/releases stock accordingly)

## 8. Configuration and Deployment
- Config via environment variables (see README and docker-compose):
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
  - `PRODUCTS_API_BASE` for `carts` to reach `products`
- Dockerfile builds a production image using `npm ci` and `nest build`.
- `docker-compose.yaml` provisions PostgreSQL and the API service.

## 9. Testing Strategy (Optional to implement)
- Unit tests for `products` service: CRUD and `adjustStock` invariant (non-negative stock).
- Unit tests for `carts` service: add/update/remove item flows, ensuring compensation executes on simulated failures.
- E2E tests for critical flows with an ephemeral DB.

## 10. Future Improvements
- Circuit breaker/retry for cross-module HTTP calls (e.g., `@nestjs/terminus`, `opossum`).
- Outbox pattern for durable stock reservation messages (switch to async pub/sub or queues).
- Idempotency keys on `carts` mutations to avoid duplicate reservations on retries.
- Pagination and filtering for products.
- Dedicated media service for images (instead of data URLs) if size and traffic grow.
