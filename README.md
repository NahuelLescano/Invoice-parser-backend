# 🧾 Invoice Parser Backend (Arg ➡️ US • Batch Edition)

Un servicio backend de alto rendimiento construido con Node.js y TypeScript que utiliza **Google Gemini 2.5 Flash Lite** para extraer datos de múltiples facturas argentinas (A, B y C) en paralelo a partir de imágenes, validarlas estrictamente y transformarlas a un formato contable simplificado compatible con sistemas de Estados Unidos.

## 📂 Estructura del Proyecto

```text
src/
├── config/
│   └── config.ts         # Centralización de variables de entorno y loadEnvFile()
├── controllers/
│   └── invoice.ts        # Controlador batch con Promesas en paralelo y transformación
├── prompts/
│   └── invoice.prompt.ts # Prompt de auditoría impositiva aislado
├── routes/
│   └── invoice.routes.ts # Definición de rutas Express
├── schemas/
│   └── invoice.schema.ts # Esquemas rigurosos de Valibot (Input, Internal y Output)
└── index.ts              # Servidor Express y middlewares
```

## 🚀 Instalación y Configuración

1. Instalar dependencias:

```bash
pnpm install
```

2. Variables de entorno:

```bash
PORT=3000 ## O cualquier otro puerto
GOOGLEAI_API_KEY=tu_api_key_aquí
```

3. Correr en desarrollo (con Live Reload):

```bash
pnpm dev
```

## 📖 Documentación de la API

`POST /api/v1/parse-invoice`

Analiza un lote de una o más imágenes de facturas en paralelo.

**Body de la petición (JSON):**

```json
{
  "invoices": [
    {
      "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
      "mimeType": "image/jpeg"
    },
    {
      "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
      "mimeType": "image/png"
    }
  ]
}
```

**Respuesta Exitosa / Éxito Parcial (200 OK):**

Si al menos una factura se procesó correctamente, el estado es 200. Las facturas fallidas no detienen el flujo general y se informan en warnings.

```json
{
  "success": true,
  "invoices": [
    {
      "vendorName": "DISTRIBUIDORA DE BEBIDAS SRL",
      "dateOfInvoice": "2026-06-08",
      "invoiceNumber": "00013-00180863",
      "totalCostExcludingTaxes": 176964.00,
      "totalTaxes": 46888.76,
      "totalCostIncludingTaxes": 223852.76,
      "items": [
        {
          "description": "VINO CAFAYATE RESERVE TORRONTES 750 cc",
          "quantityPurchased": 6,
          "unitPrice": 7383.00
        }
      ]
    }
  ],
  "warnings": [
    "Factura #2 falló: La IA devolvió un formato que no coincide con el sistema destino."
  ]
}
```

### Errores de Estructura:

* 400 Bad Request: El payload no contiene el array invoices o los elementos no cumplen con el formato requerido por Valibot.

* 422 Unprocessable Entity: Ninguna de las facturas enviadas pudo ser procesada o validada con éxito.


## 🧪 Pruebas desde la Terminal (CLI)
El proyecto incluye un script de automatización en Bash (test-invoices.sh) optimizado para sistemas Linux. Este script toma múltiples archivos de imágenes reales, los codifica a Base64 de forma eficiente escribiendo en un búfer temporal (evitando el error de longitud de argumentos del sistema operativo), e inyecta la respuesta formateada con jq.

Ejecución:

```bash
# Otorgar permisos si es la primera vez
chmod +x test-invoices.sh

# Ejecutar pasando una o más imágenes como argumentos
./test-invoices.sh ./images/quilmes.jpeg ./images/dba.png ./images/ticket.jpg
```
