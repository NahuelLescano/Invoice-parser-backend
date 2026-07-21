import { type Schema, Type } from "@google/genai";

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
            description: `
            Precio del ítem según el proveedor.
            Para Peñaflor es el Importe total de la línea.
            Para DBA es el Precio Bot (precio final con impuestos).
            Para Coca-Cola Con IVA es el último subtotal de la línea (columna 10, incluye IVA e imp. internos).
            Para Coca-Cola Sin IVA es la suma del subtotal neto (columna 7) + imp. internos (columna 9).
          `,
          },
          ivaPorcentaje: {
            type: Type.NUMBER,
            description: "Porcentaje de IVA (21, 10.5 o 0).",
          },
          impuestosInternos: {
            type: Type.NUMBER,
            description:
              "Impuesto interno del item. Para la mayoria de los proveedores es por unidad, para Quilmes Sin IVA es el total de la línea (columna IMP.INTERNO). Para DBA es 0 (el impuesto interno es global, está en ImpuestosInternosTotal)",
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
  },
  required: [
    "proveedorNombre",
    "numeroFactura",
    "fecha",
    "items",
    "subtotalNeto",
    "ivaTotal",
    "impuestosInternosTotal",
  ],
} as const;
