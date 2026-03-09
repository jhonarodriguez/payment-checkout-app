# Copilot Instructions

## Project Overview

Full-stack payment checkout application integrating with the **Wompi** payment gateway. The backend is a NestJS API and the frontend lives alongside it in the monorepo at `payment-checkout-app/`.

---

## Build, Test & Lint Commands

### Backend — `payment-checkout-app/backend`

```bash
# Development
npm run start:dev       # Watch mode
npm run start:prod      # Production (from dist/)

# Build
npm run build

# Tests
npm test                                      # All unit tests (spec files in src/)
npm run test:watch                            # Watch mode
npm run test:cov                              # With coverage
npm run test:e2e                              # E2E (test/app.e2e-spec.ts)
npx jest --testPathPattern="products"         # Run a single test file by name

# Lint / Format
npm run lint            # ESLint with --fix
npm run format          # Prettier
```

### Frontend — `payment-checkout-app/frontend`

```bash
npm run dev       # Dev server with HMR (http://localhost:5173)
npm run build     # TypeScript check + Vite production build → dist/
npm run preview   # Preview the production build locally
npm run lint      # ESLint check (no auto-fix)
```

---

## Architecture

The backend follows **Clean Architecture** with DDD-style module boundaries. Every feature module (`products`, `customers`, `transactions`, `payments`, `deliveries`) has three layers:

```
modules/<feature>/
├── domain/
│   ├── entities/          # Pure business objects (no ORM decorators)
│   └── ports/             # Interfaces (e.g., ProductRepositoryPort)
├── application/
│   └── use-cases/         # Orchestrate domain logic, return Result<T,E>
└── infrastructure/
    ├── adapters/          # TypeORM entities + repository implementations
    ├── dto/               # Request/response DTOs with class-validator
    └── <feature>.controller.ts
```

**Dependency direction**: infrastructure → application → domain. Use cases depend on port interfaces, never directly on TypeORM adapters.

### Key Shared Utilities

- `src/shared/result.ts` — `Result<T, E>` pattern. All use cases return `Result.ok(value)` or `Result.fail(error)`. Controllers check `result.isFailure` and map to HTTP status codes manually.
- `src/shared/errors/domain-errors.ts` — `NotFoundError` (→ 404) and `ValidationError` (→ 400).

### Payment Flow (core business logic)

`POST /api/transactions` triggers `ProcessPaymentUseCase`, which:
1. Validates product & stock
2. Gets or creates customer by email
3. Calculates total: `productPrice + BASE_FEE_IN_CENTS + DELIVERY_FEE_IN_CENTS`
4. Creates a PENDING transaction with reference `TXN-{timestamp}-{random}`
5. Calls `WompiAdapter` (implements `PaymentGatewayPort`) with SHA256 integrity hash
6. On APPROVED: creates delivery record, decrements stock using `GREATEST()` to prevent race conditions
7. Returns transaction details or maps gateway error → 402

---

## Key Conventions

### Module Injection Tokens

Ports are injected via string tokens, not class references:

```typescript
// In module providers:
{ provide: 'PRODUCT_REPOSITORY', useClass: ProductTypeOrmRepository }

// In use case constructor:
constructor(@Inject('PRODUCT_REPOSITORY') private repo: ProductRepositoryPort) {}
```

Tokens follow the pattern `'<ENTITY>_REPOSITORY'` or `'PAYMENT_GATEWAY'`.

### Controller Response Pattern

Controllers never throw — they handle `Result` and return plain objects:

```typescript
if (result.isFailure) {
  return res.status(404).json({ success: false, message: result.error.message });
}
return res.status(200).json({ success: true, data: result.value });
```

HTTP status codes used: 200, 201, 400, 402 (payment failed), 404, 500, 502 (Wompi unreachable).

### DTOs

- Request DTOs go in `infrastructure/dto/`, decorated with `@ApiProperty` and `class-validator`.
- The global `ValidationPipe` uses `whitelist: true` and `forbidNonWhitelisted: true` — unknown fields are rejected.
- Route params use `ParseUUIDPipe`: `@Param('id', ParseUUIDPipe) id: string`.

### TypeORM Entities

- All PKs: `@PrimaryGeneratedColumn('uuid')`
- All entities include `@CreateDateColumn` / `@UpdateDateColumn`
- `synchronize: true` is enabled (no migration files — schema is auto-synced)
- Enums defined inline with TypeScript `enum` and referenced in `@Column({ type: 'enum', enum: ... })`

### Prices

All monetary values are stored and transmitted in **cents** (COP). The suffix `_in_cents` is used consistently (e.g., `price_in_cents`, `total_in_cents`, `BASE_FEE_IN_CENTS`).

---

## Environment Variables

Create a `.env` file in `backend/` (see `.env.example`):

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=...
DB_PASS=...
DB_NAME=checkout_db

PAYMENT_PUBLIC_KEY=...
PAYMENT_PRIVATE_KEY=...
PAYMENT_EVENTS_KEY=...
PAYMENT_INTEGRITY_KEY=...
PAYMENT_API_URL=https://api-sandbox.co.uat.wompi.dev/v1

PORT=3001
FRONTEND_URL=http://localhost:5173
BASE_FEE_IN_CENTS=300000
DELIVERY_FEE_IN_CENTS=200000
```

---

## API Reference

Base URL: `http://localhost:3001/api` | Swagger: `http://localhost:3001/api/docs`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/products` | List all products |
| GET | `/products/:id` | Get product by UUID |
| GET | `/payments/acceptance-token` | Get Wompi acceptance token (required before paying) |
| POST | `/transactions` | Process a payment end-to-end |
| GET | `/transactions/:id` | Get transaction by UUID |
| GET | `/deliveries/transaction/:transactionId` | Get delivery for a transaction |

---

## Frontend Architecture

Stack: **React 19 + Vite + TypeScript + Redux Toolkit + React Router + React Hook Form + Axios**.

```
frontend/src/
├── pages/          # ProductPage → CheckoutPage → ResultPage (4-step flow)
├── components/     # CreditCardForm, PaymentSummary
├── store/slices/   # productSlice, checkoutSlice, transactionSlice
├── services/       # api.ts (Axios instance), payment.service.ts, product.service.ts
├── utils/          # card.utils.ts (formatting, brand detection)
└── types/          # Shared TypeScript interfaces
```

The checkout progresses through `checkoutSlice.currentStep` (1–5). Checkout state is persisted to `localStorage` under the key `checkout_progress` via a custom Redux middleware.

### Wompi Card Tokenization

Raw card data is **never sent to the backend**. The frontend tokenizes directly with Wompi before calling the backend:

1. `GET /payments/acceptance-token` → backend proxies Wompi's `GET /merchants/{publicKey}` and returns `acceptanceToken`.
2. Frontend POSTs card data directly to Wompi `POST /tokens/cards` → receives `cardToken`.
3. Frontend posts `cardToken` + `acceptanceToken` + delivery info to `POST /api/transactions`.
4. Frontend polls `GET /api/transactions/:id` (up to 12 times, 2.5 s intervals) until status resolves from PENDING.

---

## Database Seeding

On bootstrap, `src/database/seeds/product.seed.ts` seeds 3 initial products (Audífonos, Teclado, Mouse) if the table is empty.
