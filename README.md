# Invoice Parser Backend

Un servicio backend construido con Node.js y TypeScript que utiliza **Google Gemini** para extraer datos de facturas argentinas (A, B y C) a partir de imágenes, validarlas y transformarlas a un formato contable estandarizado.

## Caracteristicas Principales

- **Procesamiento en Lote y Paralelismo:** Recibe multiples facturas en una sola peticion HTTP, procesandolas en paralelo mediante la API de Gemini.
- **Motor de Reglas de Negocio por Proveedor:** Logica condicional avanzada para procesar facturacion de distintos proveedores (DBA, Penaflor, Wine Co S.A., Coca Cola, Quilmes, Moet Hennessy).
- **Normalizacion de Stock (Bultos a Unidades):** La IA detecta cajas y packs (ej: "Caja x6", "Pack x12"), y el backend desglosa precios y cantidades para trabajar con la unidad minima real.
- **Flexibilidad de Precios:** Retorna simultaneamente el precio unitario con IVA y sin IVA.
- **Tolerancia a Fallos Parciales:** Patron *Result* con `Promise.allSettled`. Si una factura falla, las demas se procesan igual y las fallidas se informan en `warnings`.
- **Validacion con Valibot:** Validacion estricta de entrada y salida para un flujo predecible.
- **Docker + Fly.io:** Listo para deployar con Docker.

## Estructura del Proyecto

```text
src/
├── config/
│   └── env.ts              # Variables de entorno validadas con Valibot
├── controllers/
│   └── invoice.ts          # Controlador batch, normalizacion y switch de proveedores
├── middleware/
│   └── middleware.ts        # CORS, JSON parser, Morgan logger
├── prompts/
│   └── invoice.ts          # Prompt de auditoria impositiva
├── routes/
│   └── invoice.ts          # Definicion de rutas Express
├── schemas/
│   ├── env.ts              # Schema de variables de entorno
│   ├── geminiInvoice.ts    # Schema de respuesta de Gemini
│   └── invoice.ts          # Schemas de entrada y salida
├── utils/
│   └── tryCatch.ts         # Wrapper de manejo de errores
└── index.ts                # Servidor Express y middlewares
```

## Instalacion y Configuracion

1. Instalar dependencias:

```bash
pnpm install
```

2. Variables de entorno:
Crea un archivo `.env` en la raiz del proyecto basado en `.env.example`:

```bash
PORT=3000
GEMINI_API_KEY=tu_api_key_aqui
GOOGLEAI_MODEL=gemini-2.0-flash
```

3. Correr en desarrollo:

```bash
pnpm dev
```

## Endpoints

### `GET /health`

Health check del servidor.

```json
"Ok"
```

### `POST /api/v1/invoice`

Analiza un lote de una o mas imagenes de facturas en paralelo.

**Body de la peticion (JSON):**

```json
{
  "invoices": [
    {
      "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
      "mimeType": "image/jpeg"
    }
  ]
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "success": true,
  "invoices": [
    {
      "vendorName": "DISTRIBUIDORA DBA",
      "dateOfInvoice": "2026-06-08",
      "invoiceNumber": "00013-00180863",
      "totalCostExcludingTaxes": 176964.00,
      "totalTaxes": 46888.76,
      "totalCostIncludingTaxes": 223852.76,
      "items": [
        {
          "description": "VINO CAFAYATE RESERVE TORRONTES 750 cc (Caja x6)",
          "quantityPurchased": 6,
          "unitPriceWithIva": 8933.43,
          "unitPriceWithoutIva": 7383.00
        }
      ]
    }
  ],
  "warnings": [
    "Factura #2 fallo: La IA devolvio un formato que no coincide con el esquema requerido."
  ]
}
```

### Errores

- **400 Bad Request:** El payload no contiene el array `invoices` o los elementos no cumplen con el formato.
- **422 Unprocessable Entity:** Ninguna de las facturas pudo ser procesada o validada con exito.

## Pruebas desde la Terminal

El proyecto incluye un script Bash (`post.sh`) que transforma imagenes a Base64 y las envia al servidor:

```bash
chmod +x post.sh
./post.sh ./images/quilmes.jpeg ./images/dba.png
```

