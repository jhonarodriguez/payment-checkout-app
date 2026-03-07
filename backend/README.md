# Payment Checkout App — Backend

API REST construida con **NestJS** para procesar pagos a través de la pasarela **Wompi**. Implementa Clean Architecture con separación en capas de dominio, aplicación e infraestructura.

## Requisitos

- Node.js 18+
- PostgreSQL 14+

## Configuración

```bash
npm install
cp .env.example .env  # completar las variables requeridas
```

### Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USER` | Usuario de la base de datos | — |
| `DB_PASS` | Contraseña de la base de datos | — |
| `DB_NAME` | Nombre de la base de datos | `checkout_db` |
| `PAYMENT_PUBLIC_KEY` | Llave pública de Wompi | — |
| `PAYMENT_PRIVATE_KEY` | Llave privada de Wompi | — |
| `PAYMENT_EVENTS_KEY` | Llave de eventos de Wompi | — |
| `PAYMENT_INTEGRITY_KEY` | Llave de integridad de Wompi | — |
| `PAYMENT_API_URL` | URL de la API de Wompi | `https://api-sandbox.co.uat.wompi.dev/v1` |
| `PORT` | Puerto del servidor | `3001` |
| `FRONTEND_URL` | Origen permitido por CORS | `http://localhost:5173` |
| `BASE_FEE_IN_CENTS` | Comisión base en centavos | `300000` |
| `DELIVERY_FEE_IN_CENTS` | Costo de envío en centavos | `200000` |

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

# Un módulo específico
npx jest --testPathPattern="products"

# E2E
npm run test:e2e

# Con cobertura
npm run test:cov
```

## Arquitectura

Cada módulo (`products`, `customers`, `transactions`, `payments`, `deliveries`) sigue una estructura de tres capas:

```
modules/<feature>/
├── domain/
│   ├── entities/       # Objetos de negocio puros
│   └── ports/          # Interfaces (contratos)
├── application/
│   └── use-cases/      # Lógica de negocio, retornan Result<T, E>
└── infrastructure/
    ├── adapters/        # Entidades TypeORM + implementaciones de repositorios
    ├── dto/             # DTOs con class-validator y @ApiProperty
    └── *.controller.ts
```

### Flujo de pago

`POST /api/transactions` ejecuta `ProcessPaymentUseCase`:

1. Valida el producto y stock disponible
2. Busca o crea el cliente por email
3. Calcula el total: `precio_producto + BASE_FEE + DELIVERY_FEE`
4. Crea la transacción en estado `PENDING` con referencia `TXN-{timestamp}-{random}`
5. Llama a `WompiAdapter` con hash de integridad SHA256
6. Si es `APPROVED`: crea el registro de entrega y decrementa el stock
7. Retorna el detalle de la transacción o el error correspondiente

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/products` | Listar productos |
| `GET` | `/api/products/:id` | Obtener producto por UUID |
| `GET` | `/api/payments/acceptance-token` | Obtener token de aceptación de Wompi |
| `POST` | `/api/transactions` | Procesar un pago |
| `GET` | `/api/transactions/:id` | Obtener transacción por UUID |
| `GET` | `/api/deliveries/transaction/:transactionId` | Obtener entrega de una transacción |
