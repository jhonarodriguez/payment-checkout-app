# Payment Checkout App — Backend

API REST construida con **NestJS** para procesar pagos a través de la pasarela **Wompi**. Implementa Clean Architecture con separación estricta en capas de dominio, aplicación e infraestructura.

## Requisitos

- Node.js 18+
- PostgreSQL 14+

## Configuración

```bash
npm install
cp .env.example .env  # completar las variables requeridas
```

### Variables de entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USER` | Usuario de la base de datos | — |
| `DB_PASS` | Contraseña de la base de datos | — |
| `DB_NAME` | Nombre de la base de datos | `checkout_db` |
| `PAYMENT_PUBLIC_KEY` | Llave pública de Wompi | — |
| `PAYMENT_PRIVATE_KEY` | Llave privada de Wompi | — |
| `PAYMENT_EVENTS_KEY` | Llave de eventos de Wompi | — |
| `PAYMENT_INTEGRITY_KEY` | Llave de integridad para hash SHA256 | — |
| `PAYMENT_API_URL` | URL de la API de Wompi | `https://api-sandbox.co.uat.wompi.dev/v1` |
| `PORT` | Puerto del servidor | `3001` |
| `FRONTEND_URL` | Origen permitido por CORS | `http://localhost:5173` |
| `BASE_FEE_IN_CENTS` | Comisión base en centavos | `300000` ($3.000 COP) |
| `DELIVERY_FEE_IN_CENTS` | Costo de envío en centavos | `200000` ($2.000 COP) |

## Ejecutar el proyecto

```bash
# Desarrollo (watch mode)
npm run start:dev

# Producción
npm run build && npm run start:prod
```

La API queda disponible en `http://localhost:3001/api`.  
Documentación Swagger: `http://localhost:3001/api/docs`.

## Tests

```bash
# Todos los tests unitarios
npm test

# Watch mode
npm run test:watch

# Un módulo específico
npx jest --testPathPattern="products"

# E2E
npm run test:e2e

# Con cobertura
npm run test:cov
```

## Arquitectura

El backend aplica **Clean Architecture** con módulos DDD. Cada módulo (`products`, `customers`, `transactions`, `payments`, `deliveries`) tiene tres capas con dependencias que fluyen hacia el dominio:

```
infrastructure → application → domain
```

```
modules/<feature>/
├── domain/
│   ├── entities/        # Objetos de negocio puros (sin decoradores ORM)
│   └── ports/           # Interfaces que definen contratos externos
├── application/
│   └── use-cases/       # Lógica de negocio; retornan Result<T, E>
└── infrastructure/
    ├── adapters/         # Entidades TypeORM + implementaciones de repositorios
    ├── dto/              # DTOs con class-validator y @ApiProperty
    └── *.controller.ts   # Controladores REST
```

### Módulos y casos de uso

| Módulo | Caso de uso | Descripción |
|--------|-------------|-------------|
| `products` | `GetProductsUseCase` | Lista todos los productos |
| `products` | `GetProductByIdUseCase` | Obtiene un producto por UUID |
| `customers` | `CreateCustomerUseCase` | Crea o retorna un cliente existente por email |
| `payments` | `GetAcceptanceTokenUseCase` | Obtiene el token de aceptación de Wompi |
| `transactions` | `ProcessPaymentUseCase` | Orquesta el flujo completo de pago |
| `transactions` | `GetTransactionStatusUseCase` | Consulta el estado de una transacción en Wompi |

### Patrones clave

**Result\<T, E\>** (`src/shared/result.ts`) — todos los casos de uso retornan `Result.ok(value)` o `Result.fail(error)`. Los controladores verifican `result.isFailure` y mapean a códigos HTTP manualmente. Nunca se lanzan excepciones desde los controladores.

**Errores de dominio** (`src/shared/errors/domain-errors.ts`):
- `NotFoundError` → 404
- `ValidationError` → 400

**Tokens de inyección** — los puertos se inyectan con strings, no con referencias de clase:
```typescript
// En el módulo:
{ provide: 'PRODUCT_REPOSITORY', useClass: ProductTypeOrmRepository }

// En el caso de uso:
constructor(@Inject('PRODUCT_REPOSITORY') private repo: ProductRepositoryPort) {}
```
Convención: `'<ENTIDAD>_REPOSITORY'` o `'PAYMENT_GATEWAY'`.

**Respuesta de controladores:**
```typescript
if (result.isFailure) {
  return res.status(404).json({ success: false, message: result.error.message });
}
return res.status(200).json({ success: true, data: result.value });
```

Códigos HTTP utilizados: `200`, `201`, `400`, `402` (pago rechazado), `404`, `500`, `502` (Wompi inaccesible).

### Flujo de pago (`ProcessPaymentUseCase`)

`POST /api/transactions` ejecuta los siguientes pasos:

1. Verifica que el producto exista y tenga stock disponible
2. Busca o crea el cliente por email
3. Calcula el total: `precio_producto + BASE_FEE_IN_CENTS + DELIVERY_FEE_IN_CENTS`
4. Crea la transacción en estado `PENDING` con referencia `TXN-{timestamp}-{random}`
5. Llama a `WompiAdapter` con hash de integridad `SHA256(reference + amount + "COP" + integrityKey)`
6. Actualiza el estado de la transacción con la respuesta de Wompi
7. Si es `APPROVED`: crea el registro de entrega y decrementa el stock con `GREATEST()` para evitar race conditions
8. Retorna el detalle de la transacción o el error correspondiente

## Base de datos

PostgreSQL con TypeORM. El esquema se sincroniza automáticamente (`synchronize: true`); no hay archivos de migración.

### Entidades

**`products`**

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | PK generado |
| `name` | varchar(255) | |
| `description` | text | nullable |
| `price_in_cents` | integer | precio en centavos COP |
| `image_url` | varchar(500) | nullable |
| `stock` | integer | default 0 |
| `created_at` / `updated_at` | timestamp | auto |

**`customers`**

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | PK generado |
| `full_name` | varchar(255) | |
| `email` | varchar(255) | unique |
| `phone` | varchar(50) | nullable |
| `created_at` | timestamp | auto |

**`transactions`**

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | PK generado |
| `reference` | varchar(100) | unique, formato `TXN-{ts}-{rand}` |
| `customer_id` | UUID | FK → customers |
| `product_id` | UUID | FK → products |
| `product_amount_in_cents` | integer | |
| `base_fee_in_cents` | integer | |
| `delivery_fee_in_cents` | integer | |
| `total_in_cents` | integer | |
| `status` | enum | `PENDING` `APPROVED` `DECLINED` `ERROR` `VOIDED` |
| `gateway_transaction_id` | varchar(255) | nullable, ID de Wompi |
| `card_last_four` | varchar(4) | nullable |
| `delivery_address` | varchar(500) | |
| `delivery_city` | varchar(255) | |
| `delivery_department` | varchar(255) | |
| `created_at` / `updated_at` | timestamp | auto |

**`deliveries`**

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | PK generado |
| `transaction_id` | UUID | FK → transactions |
| `customer_id` | UUID | FK → customers |
| `address` | varchar(500) | |
| `city` | varchar(255) | |
| `department` | varchar(255) | |
| `status` | enum | `PENDING` `SHIPPED` `DELIVERED` |
| `created_at` | timestamp | auto |

### Seed inicial

Al arrancar, `src/database/seeds/product.seed.ts` inserta 3 productos si la tabla está vacía:

| Producto | Precio | Stock |
|----------|--------|-------|
| Audífonos Bluetooth Pro | $150.000 COP | 10 |
| Teclado Mecánico RGB | $250.000 COP | 5 |
| Mouse Inalámbrico Ergonómico | $80.000 COP | 15 |

> Todos los valores monetarios se almacenan y transmiten en **centavos (COP)**. Convención de sufijo: `_in_cents`.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/products` | Listar todos los productos |
| `GET` | `/api/products/:id` | Obtener producto por UUID |
| `GET` | `/api/payments/acceptance-token` | Obtener token de aceptación de Wompi |
| `POST` | `/api/transactions` | Procesar un pago completo |
| `GET` | `/api/transactions/:id` | Obtener transacción por UUID |
| `GET` | `/api/transactions/:id/status` | Consultar estado actual de la transacción |
| `GET` | `/api/deliveries/transaction/:transactionId` | Obtener entrega de una transacción |

## Convenciones de nomenclatura

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Archivo de entidad dominio | `<feature>.ts` | `product.ts` |
| Archivo de entidad TypeORM | `<feature>.entity.ts` | `product.entity.ts` |
| Repositorio TypeORM | `<feature>.typeorm.repository.ts` | `product.typeorm.repository.ts` |
| Caso de uso | `<action>-<feature>.use-case.ts` | `get-products.use-case.ts` |
| DTO | `<action>-<feature>.dto.ts` | `create-transaction.dto.ts` |
| Puerto | `<feature>.repository.port.ts` | `product.repository.port.ts` |
| Clase caso de uso | `<Action><Feature>UseCase` | `GetProductsUseCase` |
| Clase DTO | `<Action><Feature>Dto` | `CreateTransactionDto` |
