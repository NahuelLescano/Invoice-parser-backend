import {
  object,
  string,
  number,
  union,
  literal,
  InferInput,
  array,
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
  iTotal: number("El total de I debe ser un número."),
});

export type USAInvoice = InferInput<typeof USAInvoiceSystemSchema>;
