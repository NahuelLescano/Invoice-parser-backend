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
        required: [
          "insumo",
          "cantidad",
          "precioUnitario",
          "ivaPorcentaje",
          "impuestosInternos",
        ],
      },
    },
    ivaTotal: { type: "NUMBER" },
    impuestosInternosTotal: {
      type: "NUMBER",
      description:
        "Total acumulado de impuestos internos al pie del comprobante.",
    },
    percepcionesIva: {
      type: "NUMBER",
      description: "Monto por Percepción de IVA al pie. Si no hay, 0.",
    },
    percepcionesIibb: {
      type: "NUMBER",
      description:
        "Monto por Percepción de Ingresos Brutos (IIBB) al pie. Si no hay, 0.",
    },
    conceptosNoGravados: {
      type: "NUMBER",
      description:
        "Monto por conceptos o importes exentos/no gravados. Si no hay, 0.",
    },
  },
  required: [
    "proveedorNombre",
    "numeroFactura",
    "fecha",
    "items",
    "ivaTotal",
    "impuestosInternosTotal",
    "percepcionesIva",
    "percepcionesIibb",
    "conceptosNoGravados",
  ],
};
