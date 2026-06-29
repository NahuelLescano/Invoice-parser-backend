export const GeminiInvoiceSchema = {
  type: "OBJECT",
  properties: {
    proveedorNombre: {
      type: "STRING",
      description: "Razón social o nombre fantasía del emisor de la factura.",
    },
    numeroFactura: {
      type: "STRING",
      description:
        "Número completo del comprobante incluyendo punto de venta (ej: 0041-00033768).",
    },
    fecha: {
      type: "STRING",
      description:
        "Fecha de emisión del documento en formato YYYY-MM-DD para compatibilidad internacional.",
    },
    items: {
      type: "ARRAY",
      description:
        "Lista de productos o conceptos detallados en la tabla principal.",
      items: {
        type: "OBJECT",
        properties: {
          insumo: {
            type: "STRING",
            description: "Descripción del ítem o mercadería.",
          },
          cantidad: { type: "NUMBER" },
          precioUnitario: {
            type: "NUMBER",
            description: "Precio neto unitario sin impuestos.",
          },
          ivaPorcentaje: {
            type: "NUMBER",
            description: "Porcentaje de IVA (21, 10.5 o 0).",
          },
          impuestosInternos: {
            type: "NUMBER",
            description:
              "Impuesto interno aplicado por unidad. Si no se detalla por ítem, poner 0.",
          },
        },
        unidadesPorBulto: {
          type: "NUMBER",
          description:
            "Si la descripción indica que es una caja, pack o bulto (ej: 'caja x6', 'Pack x12'), extrae ese multiplicador (6, 12). Si se vende por unidad suelta o no se especifica, asigna obligatoriamente 1.",
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
      type: "NUMBER",
      description:
        "Subtotal neto general de la factura antes de aplicar impuestos (Base Imponible general). Si no hay, poner 0.",
    },
    ivaTotal: { type: "NUMBER" },
    impuestosInternosTotal: {
      type: "NUMBER",
      description:
        "Total acumulado de impuestos internos al pie del comprobante. Si no hay, poner 0.",
    },
    conceptosNoGravados: {
      type: "NUMBER",
      description:
        "Monto por conceptos o importes exentos/no gravados. Si no hay, poner 0.",
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
};
