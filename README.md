# Invoice Parser Backend 🇦🇷➡️

Este es un backend robusto y modular desarrollado en **Node.js** con **TypeScript**, diseñado para automatizar la extracción de datos de facturas argentinas (como las Facturas A de AFIP) y transformarlas a un esquema estructurado en formato JSON. 

El sistema utiliza el modelo **Gemini 2.5 Flash Lite** a través del nuevo SDK oficial de Google (`@google/genai`) y aplica filtros estrictos para adaptar la información impositiva local a las necesidades de sistemas contables internacionales (como los estadounidenses), descartando impuestos internos o percepciones y validando de manera estricta los ítems y las alícuotas de IVA (21% y 10.5%) mediante **Valibot**.

## 🚀 Tecnologías y Herramientas

- **Entorno:** Node.js
- **Gestor de Paquetes:** pnpm
- **Lenguaje:** TypeScript
- **Framework Web:** Express
- **Inteligencia Artificial:** `@google/genai` (Gemini 2.5 Flash Lite)
- **Validación de Esquemas:** Valibot
- **Ejecución en Desarrollo:** tsx (TypeScript Execute)

## 📁 Estructura del Proyecto

```text
invoice-parser-backend/
├── src/
│   ├── schemas/
│   │   └── invoice.schema.ts      # Esquema de validación estricta con Valibot
│   ├── controllers/
│   │   └── invoice.controller.ts  # Lógica de comunicación con el SDK de Gemini
│   ├── routes/
│   │   └── invoice.routes.ts      # Definición de endpoints de Express
│   └── index.ts                   # Punto de entrada principal y configuración del servidor
├── .env                           # Variables de entorno (Claves de API)
├── .gitignore                     # Archivos excluidos de Git
├── tsconfig.json                  # Configuración del compilador de TypeScript
└── package.json                   # Dependencias y scripts del proyecto
```

## 🛠️ Instalación y Configuración

1. **Clonar el repositorio e instalar las dependencias:**
   ```bash
   pnpm install
   ```

2. **Configurar las variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto y añade tu clave de API obtenida en Google AI Studio:
   ```env
   PORT=3000
   GEMINI_API_KEY=tu_api_key_de_gemini_aqui
   ```

## 💻 Scripts Disponibles

- **Modo Desarrollo (con recarga en vivo):**
  ```bash
  pnpm dev
  ```
- **Modo Producción (Inicio directo):**
  ```bash
  pnpm start
  ```

## 🔌 API Endpoints

### Procesar Factura
- **URL:** `/api/invoices/parse`
- **Método:** `POST`
- **Content-Type:** `application/json`

#### Cuerpo de la Petición (Payload):
Debe enviarse la imagen escaneada o fotografiada de la factura codificada en formato Base64.
```json
{
  "mimeType": "image/jpeg",
  "imageBase64": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDA..."
}
```

#### Ejemplo de Respuesta Exitosa (200 OK):
El backend filtra de forma automática percepciones o impuestos internos adicionales, consolidando limpiamente los conceptos para sistemas estándar internacionales:
```json
{
  "success": true,
  "data": {
    "proveedorNombre": "DBA SRL",
    "numeroFactura": "00013-00180863",
    "fecha": "08/06/2026",
    "items": [
      {
        "insumo": "VINO CAFAYATE RESERVE TORRONTES 750 cc",
        "cantidad": 6,
        "precioUnitario": 5216.913,
        "ivaPorcentaje": 21
      },
      {
        "insumo": "TEQUILA CUERVO ORO 750 cc",
        "cantidad": 3,
        "precioUnitario": 27114.43,
        "ivaPorcentaje": 21
      }
    ],
    "ivaTotal": 23655.40
  }
}
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para obtener más detalles.
