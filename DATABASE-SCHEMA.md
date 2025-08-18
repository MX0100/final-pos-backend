## Database Schema and Design

This document describes the data model for the Final POS backend, implemented with PostgreSQL and TypeORM. The schema focuses on Products and Carts, enabling stock reservations with optimistic locking and cart lifecycle management (expiry vs deletion).

### Conventions

- UUID primary keys for all entities
- Timestamps stored as `timestamptz` (UTC)
- Application-level optimistic locking via a `version` column on `products`
- Cascading deletes where appropriate (e.g., cart items removed when their cart is deleted)

### Entities

#### products

- `id (uuid, pk)` – unique product identifier
- `name (varchar(64), not null)` – display name
- `description (varchar(2048), null)` – optional long description
- `image (text, not null)` – base64 data URL (<= 1MB)
- `price (numeric, not null)` – price stored as numeric to avoid float errors
- `stock (int, not null, default 0)` – current available stock (non-negative)
- `category (varchar(64), null)` – optional category tag
- `version (int, not null)` – optimistic lock version for safe concurrent adjustments
- `created_at (timestamptz, default now())`
- `updated_at (timestamptz, default now(), on update now())`

Notes:

- Stock adjustments are executed through service-layer methods that enforce optimistic concurrency and validation (non-negative invariant).
- Batch reservations are supported to atomically apply multiple deltas where possible (all-or-nothing or partial acceptance).

#### carts

- `id (uuid, pk)` – unique cart identifier
- `status (varchar(20), not null, default 'active')` – one of: `active | expired | paid`
- `expires_at (timestamptz, null)` – scheduled expiry timestamp used by the background job
- `created_at (timestamptz, default now())`
- `updated_at (timestamptz, default now(), on update now())`

Notes:

- Carts are set to expire by a scheduled job (every 5 minutes). When expired, carts are not deleted; they are marked `expired` for analytics, and stock is released.
- When a cart is explicitly deleted, all reserved stock is released first, then the cart and its items are removed.

#### cart_items

- `id (uuid, pk)` – unique cart item identifier
- `cart_id (uuid, fk -> carts.id, not null, on delete cascade)` – owning cart
- `product_id (uuid, not null)` – referenced product identifier
- `quantity (int, not null)` – quantity reserved in the cart

Constraints:

- Unique constraint on `(cart_id, product_id)` ensures one row per product within a cart
- `quantity` must be a non-negative integer at the service layer

### Relationships

- One `cart` has many `cart_items`
- Each `cart_item` references a single `product` by `product_id` (loose coupling: reference only by ID)

### Lifecycle and Invariants

1. Create Cart
   - Initializes with `status=active` and `expires_at` set based on policy (default 5 minutes)
2. Add/Update Items
   - Add mode: increases quantities incrementally
   - Overwrite mode: sets exact quantities (0 removes the item)
   - For each change, stock is reserved/released in the products module first; persistence follows, with compensation on failure
   - Successful updates extend `expires_at`
3. Expiry
   - A scheduled job marks overdue active carts as `expired` and releases stock
   - Expired carts remain for analytics; they cannot be mutated
4. Deletion
   - On delete, all reserved stock is released; cart and items are removed (cascade)

### Indices and Performance

- Implicit primary key indices on all `id` columns
- Unique index on `cart_items(cart_id, product_id)` for idempotent item upserts
- Consider additional indexes on `carts(status, expires_at)` for efficient expiry scans

### Error Handling and Consistency

- Stock adjustments use optimistic locking to prevent lost updates under concurrency
- Batch operations surface per-item success/failure with partial or all-or-nothing semantics
- Best-effort stock release on expiry/deletion; failures are logged and do not block cart lifecycle progress
