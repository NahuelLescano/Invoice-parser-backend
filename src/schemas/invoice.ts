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
    [literal(21), literal(10.5), literal(0)],
    "El IVA debe ser estrictamente 21 o 10.5.",
  ),
  impuestosInternos: number(
    "El monto de impuestos internos debe ser un número.",
  ),
});

export const USAInvoiceSystemSchema = object({
  proveedorNombre: string("La razón social del proveedor es obligatoria."),
  numeroFactura: string("El número de factura es obligatorio."),
  fecha: string("La fecha es obligatoria."),
  items: array(ItemInvoiceSchema, "La lista de ítems debe ser un arreglo."),
  ivaTotal: number("El monto total de IVA debe ser un número."),
  impuestosInternosTotal: number(
    "El monto total de impuestos internos debe ser un número.",
  ),
  percepcionesIva: number(
    "El monto total de percepciones de IVA debe ser un número.",
  ),
  percepcionesIibb: number(
    "El monto total de percepciones de IIBB debe ser un número.",
  ),
  conceptosNoGravados: number(
    "El monto total de conceptos no gravados debe ser un número.",
  ),
});

export type USAInvoice = InferInput<typeof USAInvoiceSystemSchema>;

export const ParseInvoiceBodySchema = object({
  invoices: pipe(
    array(
      object({
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
      }),
    ),
    minLength(1, "Debe proporcionar al menos una factura para procesar."),
  ),
});

// export const ParseInvoiceBodySchema = object({
//   imageBase64: pipe(
//     string(),
//     trim(),
//     minLength(1, "La imagen en base64 no puede estar vacía."),
//   ),
//   mimeType: pipe(
//     string(),
//     trim(),
//     minLength(1, "El tipo MIME es obligatorio."),
//   ),
// });

export type ParseInvoiceBody = InferInput<typeof ParseInvoiceBodySchema>;

export interface USInvoicePayload {
  vendorName: string;
  dateOfInvoice: string;
  invoiceNumber: string;
  totalCostExcludingTaxes: number;
  totalTaxes: number;
  totalCostIncludingTaxes: number;
  items: {
    description: string;
    quantityPurchased: number;
    unitPrice: number;
  }[];
}
