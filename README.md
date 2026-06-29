# 🧾 Invoice Parser Backend (Arg ➡️ US • Batch & Business Rules Edition)

Un servicio backend de alto rendimiento construido con Node.js y TypeScript que utiliza **Google Gemini 2.5 Flash Lite** para extraer datos de múltiples facturas argentinas (A, B y C) en paralelo a partir de imágenes, validarlas estrictamente y transformarlas a un formato contable estandarizado.

## ✨ Características Principales

- **Procesamiento en Lote y Paralelismo:** Capacidad para recibir múltiples facturas en una sola petición HTTP, procesándolas en paralelo mediante la API de Gemini para optimizar los tiempos de respuesta.
- **Motor de Reglas de Negocio por Proveedor:** Implementa lógica condicional avanzada para procesar la caótica facturación de distintos proveedores (DBA, Peñaflor, Wine Co S.A., Coca Cola, Quilmes, Moet Hennessy). Aplica promedios de impuestos internos y cálculos inversos de IVA según las reglas comerciales de cada distribuidora.
- **Normalización de Stock (Bultos a Unidades):** La IA detecta de forma inteligente cajas y packs (ej: "Caja x6", "Pack x12"), y el backend desglosa matemáticamente los precios y cantidades para que el sistema de inventario trabaje siempre con la unidad mínima real (botellas/latas).
- **Flexibilidad de Precios (Frontend-Agnostic):** Retorna simultáneamente el precio unitario exacto `Con IVA` y `Sin IVA`, delegando la decisión de visualización al frontend/cliente.
- **Tolerancia a Fallos Parciales:** Implementa el patrón *Result* con `Promise.allSettled`. Si una factura del lote está corrupta o falla la validación, el endpoint no explota; procesa las demás con éxito y devuelve un desglose de las fallidas en un array de `warnings`.
- **Validación con Estándar Moderno:** Validación estricta de entrada y salida utilizando **Valibot** para un flujo predecible sin excepciones ocultas (`throw`).
- **DX Impecable (Developer Experience):** Configuración de Alias Paths (`@/*`) para evitar rutas relativas complejas e importaciones limpias.

## 📂 Estructura del Proyecto

```text
src/
├── config/
│   └── config.ts         # Centralización de variables de entorno y loadEnvFile()
├── controllers/
│   └── invoice.ts        # Controlador batch, normalización de bultos y switch de proveedores
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
Crea un archivo .env en la raíz del proyecto:

```bash
Fragmento de código
PORT=3000
API_V1=/api/v1
GOOGLEAI_API_KEY=tu_api_key_aqui
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
    "Factura #2 falló: La IA devolvió un formato que no coincide con el esquema requerido."
  ]
}
```

*(Nota: Observar cómo quantityPurchased ya viene multiplicado y los precios unitarios divididos si el producto original venía en caja).*

## Errores de Estructura:

* 400 Bad Request: El payload no contiene el array invoices o los elementos no cumplen con el formato.

* 422 Unprocessable Entity: Ninguna de las facturas enviadas pudo ser procesada o validada con éxito.

## 🧪 Pruebas desde la Terminal (CLI)
El proyecto incluye un script de automatización en Bash (post.sh) optimizado para sistemas Linux. Transforma múltiples imágenes reales a Base64 dinámicamente y las envía al servidor en una sola petición.

1. Ejecución:

```bash
# Otorgar permisos si es la primera vez
chmod +x post.sh
```

# Ejecutar pasando una o más imágenes como argumentos
./test-invoices.sh ./images/quilmes.jpeg ./images/dba.png

Desarrollado bajo patrones de diseño modernos, priorizando el tipado estricto y el control absoluto de reglas de negocio en tiempo de ejecución.
