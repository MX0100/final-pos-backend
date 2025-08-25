# Final POS — Database Schema & Design (PostgreSQL + TypeORM)

This document describes the data model and core behaviors for the Final POS backend. The system centers on **Products** and **Carts**, supports **stock reservations** with optimistic locking, and manages **cart lifecycle** (active → expired/paid).

---

## Conventions

- **UUID** primary keys for all entities  
- Timestamps use **`timestamptz` (UTC)**  
- **Optimistic locking** on products via `@VersionColumn()`  
- **Database-level integrity**: CHECK/UNIQUE/INDEX constraints  
- **Cascade delete** where appropriate (e.g., cart → cart_items)

---

## Entities

### `products`

| Column       | Type                    | Details                                                                 |
|--------------|-------------------------|-------------------------------------------------------------------------|
| `id`         | `uuid` (pk)             | Product identifier                                                      |
| `name`       | `varchar(64)`           | **Unique** display name                                                 |
| `description`| `varchar(2048)` nullable| Optional long description                                               |
| `image`      | `text`                  | Base64 data URL (validated to ≤ 1MB)                                    |
| `price`      | `numeric(12,2)`         | Monetary value; represented as **string** in code to preserve precision |
| `stock`      | `int` default `0`       | Available stock                                                         |
| `category`   | `varchar(64)` nullable  | Optional category tag                                                   |
| `version`    | `int`                   | TypeORM version for optimistic locking                                  |
| `createdAt`  | `timestamptz`           | Creation timestamp                                                      |
| `updatedAt`  | `timestamptz`           | Last update timestamp                                                   |

**Constraints / Indexes**
- `CHK_products_stock_nonnegative`: `stock >= 0`
- `CHK_products_price_nonnegative`: `price >= 0`
- `uq_products_name`: unique index on `name`
- `idx_products_category_createdAt`: index on `category` (used for category filtering)

**Concurrency**
- Single-item stock changes run through `adjustStockWithOptimisticLock()` with automatic retries (max 3).

---

### `carts`

| Column      | Type              | Details                                           |
|-------------|-------------------|---------------------------------------------------|
| `id`        | `uuid` (pk)       | Cart identifier                                   |
| `status`    | `varchar(20)`     | `active \| expired \| paid` (default `active`)    |
| `expiresAt` | `timestamptz`     | Expiry timestamp                                  |
| `createdAt` | `timestamptz`     | Creation timestamp                                |
| `updatedAt` | `timestamptz`     | Last update timestamp                             |

**Lifecycle**
- `active → expired` (by scheduled job)  
- `active → paid` (on checkout)  
- Deletion releases stock and removes the cart (cascade to items)

**Expiry**
- Default TTL: **15 minutes** (`CART_EXPIRY_MINUTES`)  
- Background job scans every **5 minutes** and marks overdue active carts as `expired` while releasing stock

---

### `cart_items`

| Column      | Type          | Details                                                                 |
|-------------|---------------|-------------------------------------------------------------------------|
| `id`        | `uuid` (pk)   | Item identifier                                                         |
| `cartId`    | `uuid`        | Owner cart; **`onDelete: CASCADE`** via `@ManyToOne`                    |
| `productId` | `uuid`        | Product identifier (logical reference; module-level decoupling)         |
| `quantity`  | `int`         | Reserved quantity                                                       |

**Constraint**
- `uq_cart_item_product`: **unique** `(cartId, productId)` — one line per product per cart

---

## Relationships

- `Cart (1) ── (n) CartItem` (cascade delete on cart removal)
- `CartItem (n) ── (1) Cart`
- Items reference products by `productId` without a physical FK to maintain service decoupling

---

## API Endpoints (Core)

### Products API (`/api/v1/products`)
- `POST /:id/stock/adjust?delta=N&opId?=…` — single product stock adjustment (uses optimistic locking)
- `POST /batch-reservation` — batch stock reservations/releases for cart operations  
  Request items: `[{ productId, qtyDelta, opId? }]`  
  - `qtyDelta < 0` → reserve
  - `qtyDelta > 0` → release  
  - `opId` for idempotency/tracing

### Carts API (`/api/v1/carts`)
- `POST /` — create a new cart
- `POST /:cartId/items` — **add** mode (incremental quantities)
- `PUT /:cartId/items` — **overwrite** mode (set exact quantities; `0` removes)
- `PATCH /:cartId/items/:productId` — update a single item’s quantity
- `GET /:cartId` — get cart with items
- `DELETE /:cartId` — delete cart and release stock

---

## Operational Flow

1. **Create Cart**  
   Initialize `status=active`, set `expiresAt = now + 15min`, return `cartId`.

2. **Add / Update Items**  
   - **Add mode** (`POST /items`): add positive quantities on top of existing amounts.  
   - **Overwrite mode** (`PUT /items`): set final quantities (`0` removes).  
   - Perform **batch stock reservation** against Products first; then persist cart items.  
   - Any successful update **extends `expiresAt` by 15 minutes**.

3. **Expiry Processing**  
   Cron scans `active` carts whose `expiresAt < now`, marks them `expired`, and **releases reserved stock**.

4. **Deletion**  
   Release all reserved stock, cascade-delete `cart_items`, then delete the cart.

---

## Concurrency & Error Handling

- **Optimistic locking** on product updates via `@VersionColumn()`  
- **Automatic retry** for version conflicts (default 3 attempts)  
- **Batch operations** support both partial success and all-or-nothing modes  
- **Cross-service calls**: Carts ↔ Products via HTTP using a generated OpenAPI client  
- **Compensation**: on write failures, reverse stock changes where applicable

---

## Indexing & Performance

- Implicit PK indexes on all UUID primary keys  
- `products.name` unique index  
- `products.category` index for category filtering  
- `cart_items (cartId, productId)` unique composite key

---