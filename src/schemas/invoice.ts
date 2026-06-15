import {
  object,
  string,
  number,
  union,
  literal,
  InferInput,
  array,
  minLength,
  trim,
  pipe,
} from "valibot";

export const ItemInvoiceSchema = object({
  insumo: string("El nombre del insumo es obligatorio y debe ser texto."),
  cantidad: number("La cantidad debe ser un número."),
  precioUnitario: number("El precio unitario debe ser un número."),
  ivaPorcentaje: union(
    [literal(21), literal(10.5)],
    "El IVA debe ser estrictamente 21 o 10.5.",
  ),
});

export const USAInvoiceSystemSchema = object({
  proveedorNombre: string("La razón social del proveedor es obligatoria."),
  numeroFactura: string("El número de factura es obligatorio."),
  fecha: string("La fecha es obligatoria."),
  items: array(ItemInvoiceSchema, "La lista de ítems debe ser un arreglo."),
  ivaTotal: number("El IVA total debe ser un número."),
});

export type USAInvoice = InferInput<typeof USAInvoiceSystemSchema>;

export const ParseInvoiceBodySchema = object({
  imageBase64: pipe(
    string(),
    trim(),
    minLength(1, "La imagen en base64 no puede estar vacía."),
  ),
  mimeType: pipe(
    string(),
    trim(),
    minLength(1, "El tipo MIME es obligatorio."),
  ),
});

export type ParseInvoiceBody = InferInput<typeof ParseInvoiceBodySchema>;

export const GeminiInvoiceSchema = {
  type: "OBJECT",
  properties: {
    proveedorNombre: {
      type: "STRING",
      description: "Razón social del emisor de la factura (quien vende).",
    },
    numeroFactura: {
      type: "STRING",
      description:
        "Número de factura completo, incluyendo punto de venta (ej: 00013-00180863).",
    },
    fecha: {
      type: "STRING",
      description: "Fecha de emisión de la factura en formato DD/MM/AAAA.",
    },
    items: {
      type: "ARRAY",
      description: "Lista de todos los insumos o productos facturados.",
      items: {
        type: "OBJECT",
        properties: {
          insumo: {
            type: "STRING",
            description: "Nombre o descripción del producto/insumo.",
          },
          cantidad: { type: "NUMBER", description: "Cantidad comprada." },
          precioUnitario: {
            type: "NUMBER",
            description: "Precio por unidad sin impuestos.",
          },
          ivaPorcentaje: {
            type: "NUMBER",
            description:
              "Porcentaje de IVA aplicado (estrictamente 21 o 10.5).",
          },
        },
        required: ["insumo", "cantidad", "precioUnitario", "ivaPorcentaje"],
      },
    },
    ivaTotal: {
      type: "NUMBER",
      description:
        "Monto total del IVA de la factura. No incluir ingresos brutos ni impuestos internos.",
    },
  },
  required: ["proveedorNombre", "numeroFactura", "fecha", "items", "ivaTotal"],
};
