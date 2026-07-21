import {
  object,
  string,
  number,
  union,
  literal,
  array,
  pipe,
  trim,
  minLength,
  type InferInput,
} from "valibot";

export const ParseInvoiceBodySchema = object({
  invoices: pipe(
    array(
      object({
        imageId: pipe(
          string(),
          minLength(1, "El ID de la imagen es obligatorio."),
        ),
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
    minLength(1, "Debes enviar al menos una factura para procesar."),
  ),
});

export type ParseInvoiceBody = InferInput<typeof ParseInvoiceBodySchema>;

export const ItemFacturaSchema = object({
  insumo: string(),
  cantidad: number(),
  precioUnitario: number(),
  ivaPorcentaje: union([literal(21), literal(10.5), literal(0)]),
  impuestosInternos: number(),
  unidadesPorBulto: number(),
});

export const FacturaArgSchema = object({
  proveedorNombre: string(),
  numeroFactura: pipe(string(), trim()),
  fecha: string(),
  items: array(ItemFacturaSchema),
  subtotalNeto: number(),
  ivaTotal: number(),
  impuestosInternosTotal: number(),
});

export type FacturaArg = InferInput<typeof FacturaArgSchema>;

export interface USInvoicePayload {
  imageId: string;
  vendorName: string;
  dateOfInvoice: string;
  invoiceNumber: string;
  totalCostExcludingTaxes: number;
  totalTaxes: number;
  totalCostIncludingTaxes: number;
  items: {
    description: string;
    quantityPurchased: number;
    unitPriceWithIva: number;
    unitPriceWithoutIva: number;
  }[];
}
