# Payment Checkout App

Aplicación fullstack de checkout de pagos integrada con la pasarela **Wompi**. Permite al usuario seleccionar un producto, ingresar datos de entrega y pago con tarjeta de crédito, y recibir el resultado del pago en tiempo real.

## Estructura del repositorio

```
payment-checkout-app/
├── backend/    # API REST — NestJS · Clean Architecture · PostgreSQL · TypeORM
└── frontend/   # SPA — React 19 · Redux Toolkit · Vite
```

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | NestJS 11, TypeScript, TypeORM, PostgreSQL 14 |
| Frontend | React 19, Vite 7, Redux Toolkit 2, React Router 7, React Hook Form 7 |
| Pagos | Wompi (tokenización en el cliente, procesamiento en el servidor) |
| Validación | class-validator (backend), React Hook Form + Luhn (frontend) |
| Documentación | Swagger / OpenAPI en `/api/docs` |

## Flujo de checkout

```
[1] Selección de producto
        ↓
[2] Formulario de tarjeta + entrega
        ↓
[3] Resumen y confirmación
        ↓
[4] Tokenización (Frontend → Wompi)
        ↓
[5] Procesamiento (Frontend → Backend → Wompi)
        ↓
[6] Polling de estado (hasta resolución)
        ↓
[7] Resultado (APPROVED / DECLINED / ERROR)
```

> La tarjeta **nunca se envía al backend**. El frontend tokeniza directamente con Wompi y solo envía el token al servidor.

## Requisitos previos

- Node.js 18+
- PostgreSQL 14+
- Credenciales de Wompi (sandbox disponible en [sandbox.wompi.co](https://sandbox.wompi.co))

## Inicio rápido

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # completar DB_* y PAYMENT_* requeridos
npm run start:dev      # disponible en http://localhost:3001/api
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # completar VITE_PAYMENT_PUBLIC_KEY
npm run dev            # disponible en http://localhost:5173
```

## Productos de prueba (seed automático)

Al iniciar el backend, se insertan automáticamente 3 productos si la tabla está vacía:

| Producto | Precio |
|----------|--------|
| Audífonos Bluetooth Pro | $150.000 COP |
| Teclado Mecánico RGB | $250.000 COP |
| Mouse Inalámbrico Ergonómico | $80.000 COP |

## Tests y cobertura

El backend cuenta con **125 tests unitarios** distribuidos en **20 suites**, con cobertura de ~99% sobre el código de negocio.

```
npm run test:cov --prefix backend
```

| Métrica    | Global  |
|------------|---------|
| Statements | 98.86 % |
| Branches   | 98.80 % |
| Functions  | 92.53 % |
| Lines      | 98.74 % |

> El reporte HTML detallado se genera en `backend/coverage/lcov-report/index.html`.

![Coverage report](docs/coverage.png)

## Documentación

- Swagger UI: `http://localhost:3001/api/docs`
- [`backend/README.md`](backend/README.md) — configuración, arquitectura y API
- [`frontend/README.md`](frontend/README.md) — configuración, flujo y convenciones
