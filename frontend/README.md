# Payment Checkout App — Frontend

SPA construida con **React 19 + Vite** que implementa un flujo de checkout en 4 pasos: selección de producto → datos de entrega y pago → confirmación → resultado. La tokenización de la tarjeta se realiza directamente con Wompi sin que los datos pasen por el backend.

## Requisitos

- Node.js 18+
- Backend corriendo en `http://localhost:3001` — ver [`../backend/README.md`](../backend/README.md)

## Configuración

```bash
npm install
cp .env.example .env  # completar las variables requeridas
```

### Variables de entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `VITE_API_URL` | URL base del backend | `http://localhost:3001/api` |
| `VITE_PAYMENT_API_URL` | URL de la API de Wompi | `https://api-sandbox.co.uat.wompi.dev/v1` |
| `VITE_PAYMENT_PUBLIC_KEY` | Llave pública de Wompi (tokenización) | — |

## Comandos

```bash
# Desarrollo con HMR
npm run dev        # http://localhost:5173

# Build de producción (incluye chequeo TypeScript)
npm run build

# Vista previa del build
npm run preview

# Lint
npm run lint
```

## Arquitectura

```
src/
├── pages/
│   ├── ProductPage/     # Paso 1 — listado y selección de producto
│   ├── CheckoutPage/    # Pasos 2-3 — formulario de tarjeta/entrega + resumen
│   └── ResultPage/      # Paso 4 — resultado de la transacción
├── components/
│   ├── CreditCardForm/  # Formulario de tarjeta + datos de entrega
│   └── PaymentSummary/  # Desglose de precios y confirmación
├── store/
│   └── slices/
│       ├── productSlice.ts      # Listado de productos desde el backend
│       ├── checkoutSlice.ts     # Estado del flujo completo (pasos 1-5)
│       └── transactionSlice.ts  # Resultado de la transacción procesada
├── services/
│   ├── api.ts               # Instancia Axios con baseURL desde VITE_API_URL
│   ├── payment.service.ts   # Integración con Wompi y backend
│   └── product.service.ts   # Fetch de productos
├── utils/
│   └── card.utils.ts        # Formateo, detección de marca (Visa/Mastercard), validación Luhn
└── types/
    └── index.ts             # Interfaces: Product, CardData, DeliveryData, TransactionResult, ApiResponse
```

### Rutas

| Ruta | Componente | Pasos |
|------|------------|-------|
| `/` | `ProductPage` | Paso 1 |
| `/checkout` | `CheckoutPage` | Pasos 2 y 3 |
| `/result` | `ResultPage` | Paso 4 |
| `*` | Redirect a `/` | — |

La navegación entre rutas es controlada por `checkoutSlice.currentStep` (valores 1-5). El paso 5 representa un reset que vuelve al inicio.

## Estado del checkout (Redux)

`checkoutSlice` centraliza todo el estado del flujo:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `currentStep` | `1–5` | Paso actual del flujo |
| `selectedProductId` | `string \| null` | UUID del producto seleccionado |
| `cardData` | `CardData \| null` | Datos completos de la tarjeta |
| `deliveryData` | `DeliveryData \| null` | Nombre, email, teléfono, dirección |
| `cardToken` | `string \| null` | Token de tarjeta devuelto por Wompi |
| `acceptanceToken` | `string \| null` | Token de aceptación de Wompi |
| `transactionId` | `string \| null` | UUID de la transacción en el backend |
| `transactionResult` | `TransactionResult \| null` | Respuesta final del pago |
| `isProcessing` | `boolean` | Indicador de pago en curso |
| `error` | `string \| null` | Mensaje de error |

El estado se persiste parcialmente en `localStorage` (clave `checkout_progress`) para sobrevivir recargas: `currentStep`, `selectedProductId`, `deliveryData`, `transactionId`, `transactionResult`.

Acciones disponibles: `selectProduct`, `setCardData`, `setCardToken`, `setDeliveryData`, `setAcceptanceToken`, `goToSummary`, `startProcessing`, `paymentSuccess`, `paymentFailed`, `resetCheckout`.

## Flujo de tokenización Wompi

La información de la tarjeta **nunca se envía al backend**:

```
1. GET  /api/payments/acceptance-token
        → backend proxies Wompi → retorna acceptanceToken

2. POST {VITE_PAYMENT_API_URL}/tokens/cards   (directo a Wompi)
        → body: { number, holder, expiry_month, expiry_year, cvc }
        → Authorization: Bearer {VITE_PAYMENT_PUBLIC_KEY}
        → retorna cardToken

3. POST /api/transactions
        → body: { cardToken, acceptanceToken, productId, customerData, deliveryData, cardLastFour }
        → el backend procesa el pago con Wompi usando la llave privada

4. GET  /api/transactions/:id/status   (polling)
        → máximo 12 intentos, intervalo 2.5 s
        → resuelve cuando status ≠ PENDING
```

## Validaciones del formulario de pago

| Campo | Reglas |
|-------|--------|
| Número de tarjeta | Requerido · 16 dígitos · algoritmo Luhn |
| Titular | Requerido · mínimo 3 caracteres |
| Vencimiento (MM/AA) | Requerido · formato `^\d{2}/\d{2}$` · mes 1-12 · año ≥ 2024 |
| CVV | Requerido · 3-4 dígitos |
| Nombre completo | Requerido · mínimo 3 caracteres |
| Email | Requerido · formato válido |
| Teléfono | Opcional · 7-10 dígitos si se ingresa |
| Dirección | Requerido · mínimo 5 caracteres |
| Ciudad / Departamento | Requerido |

La detección de marca de tarjeta es en tiempo real: **Visa** (inicia en 4), **Mastercard** (51-55 o 2221-2720).

## Stack

| Librería | Versión | Uso |
|----------|---------|-----|
| React | 19 | UI |
| Vite | 7 | Build tool + test runner (vitest) |
| Redux Toolkit | 2 | Estado global |
| React Router | 7 | Enrutamiento |
| React Hook Form | 7 | Formularios y validación |
| Axios | 1 | HTTP client |
