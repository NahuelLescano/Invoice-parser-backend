import { Type, type Schema } from "@google/genai";

export const GeminiInvoiceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    proveedorNombre: {
      type: Type.STRING,
      description: "Razón social o nombre fantasía del emisor de la factura.",
    },
    numeroFactura: {
      type: Type.STRING,
      description: "Número completo del comprobante incluyendo punto de venta.",
    },
    fecha: {
      type: Type.STRING,
      description: "Fecha de emisión del documento en formato YYYY-MM-DD.",
    },
    items: {
      type: Type.ARRAY,
      description:
        "Lista de productos o conceptos detallados en la tabla principal.",
      items: {
        type: Type.OBJECT,
        properties: {
          insumo: {
            type: Type.STRING,
            description: "Descripción del ítem o mercadería.",
          },
          cantidad: { type: Type.NUMBER },
          precioUnitario: {
            type: Type.NUMBER,
            description: "Precio neto unitario sin impuestos.",
          },
          ivaPorcentaje: {
            type: Type.NUMBER,
            description: "Porcentaje de IVA (21, 10.5 o 0).",
          },
          impuestosInternos: {
            type: Type.NUMBER,
            description: "Impuesto interno aplicado por unidad. Si no hay, 0.",
          },
          unidadesPorBulto: {
            type: Type.NUMBER,
            description:
              "Si la descripción indica caja, pack o bulto (ej: 'caja x6'), extrae ese multiplicador. Si es suelto, 1.",
          },
        },
        required: [
          "insumo",
          "cantidad",
          "precioUnitario",
          "ivaPorcentaje",
          "impuestosInternos",
          "unidadesPorBulto",
        ],
      },
    },
    subtotalNeto: {
      type: Type.NUMBER,
      description:
        "Subtotal neto general de la factura antes de aplicar impuestos.",
    },
    ivaTotal: { type: Type.NUMBER },
    impuestosInternosTotal: {
      type: Type.NUMBER,
      description: "Total acumulado de impuestos internos al pie.",
    },
    conceptosNoGravados: {
      type: Type.NUMBER,
      description: "Monto por exentos/no gravados.",
    },
  },
  required: [
    "proveedorNombre",
    "numeroFactura",
    "fecha",
    "items",
    "subtotalNeto",
    "ivaTotal",
    "impuestosInternosTotal",
    "conceptosNoGravados",
  ],
} as const;
