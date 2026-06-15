# 🧾 Invoice Parser Backend (Arg ➡️ US)

Un servicio backend robusto construido con Node.js y TypeScript que utiliza **Google Gemini 2.5 Flash Lite** para extraer datos de facturas argentinas (A, B y C) a partir de imágenes, validarlos estrictamente y transformarlos a un formato contable simplificado compatible con sistemas de Estados Unidos.

## ✨ Características Principales

- **Extracción Inteligente:** Utiliza LLMs mediante *Prompt Engineering* estructurado y `responseSchema` para asegurar que la IA devuelva siempre el formato JSON exacto sin alucinaciones.
- **Validación Estricta de Extremo a Extremo:** Implementa **Valibot** (con el patrón *Result / Errors as Values*) para sanitizar el body de entrada y asegurar matemáticamente la respuesta de la IA.
- **Transformación Impositiva (Arg -> US):** Procesa el complejo desglose impositivo argentino (IVA, Impuestos Internos, Percepciones de IIBB/IVA y Conceptos No Gravados) y los consolida matemáticamente en una estructura americana (`totalCostExcludingTaxes`, `totalTaxes`, `totalCostIncludingTaxes`).
- **Arquitectura Limpia:** Separación de responsabilidades con Alias Paths (`@/`), controladores aislados, archivos de configuración centralizados y prompts factorizados.

## 🛠️ Tecnologías Utilizadas

- **Runtime:** Node.js v20+ (con soporte nativo para `.env` vía `node:process`)
- **Lenguaje:** TypeScript (`tsx` para ejecución en desarrollo con alias paths)
- **Framework Web:** Express.js
- **Validación de Datos:** Valibot (v0.30+)
- **Inteligencia Artificial:** `@google/genai` (Gemini 2.5 Flash Lite)

## 📂 Estructura del Proyecto

\`\`\`text
src/
├── config/
│   └── config.ts         # Carga de variables de entorno (PORT, API_KEY)
├── controllers/
│   └── invoice.ts        # Lógica de extracción, validación y transformación
├── prompts/
│   └── invoice.prompt.ts # Instrucciones aisladas para la IA
├── routes/
│   └── invoice.routes.ts # Definición de endpoints
├── schemas/
│   └── invoice.schema.ts # Esquemas de Valibot e interfaces de TypeScript
└── index.ts              # Entry point y configuración de Express
\`\`\`

## 🚀 Instalación y Configuración

1. **Clonar el repositorio e instalar dependencias:**
   \`\`\`bash
   pnpm install
   \`\`\`

2. **Configurar variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto basándote en el siguiente formato:
   \`\`\`env
   PORT=3000
   GOOGLEAI_API_KEY=tu_api_key_de_google_aqui
   \`\`\`

3. **Ejecutar en modo desarrollo:**
   \`\`\`bash
   pnpm dev
   # (Asegúrate de tener un script "dev": "tsx watch src/index.ts" en tu package.json)
   \`\`\`

## 📖 Documentación de la API

### `POST /api/v1/parse-invoice`

Analiza la imagen de una factura y devuelve los datos estructurados.

**Body de la petición (JSON):**
\`\`\`json
{
  "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "mimeType": "image/jpeg"
}
\`\`\`

**Respuesta Exitosa (200 OK):**
Devuelve el formato consolidado para el sistema estadounidense.
\`\`\`json
{
  "success": true,
  "data": {
    "vendorName": "Cerveceria y Malteria Quilmes",
    "dateOfInvoice": "2026-06-09",
    "invoiceNumber": "0001-00001234",
    "totalCostExcludingTaxes": 10000.00,
    "totalTaxes": 2100.00,
    "totalCostIncludingTaxes": 12100.00,
    "items": [
      {
        "description": "Cerveza Patagonia Amber Lager",
        "quantityPurchased": 10,
        "unitPrice": 1000.00
      }
    ]
  }
}
\`\`\`

**Manejo de Errores:**
El sistema implementa códigos HTTP semánticos:
- `400 Bad Request`: Error en la estructura de entrada (Base64 o MIME faltante/inválido).
- `422 Unprocessable Entity`: La IA devolvió datos inconsistentes o faltantes según los esquemas de Valibot.
- `500 Internal Server Error`: Fallos de red o infraestructura con el servicio de Google AI.

---
*Desarrollado con foco en tipado estricto y código predecible.*
