import type { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { safeParse } from "valibot";
import { tryCatch } from "@/utils/tryCatch.ts";
import { GOOGLEAI_API_KEY, GOOGLEAI_MODEL } from "@/config/env.ts";
import { GeminiInvoiceSchema } from "@/schemas/geminiInvoice.ts";
import {
  FacturaArgSchema,
  ParseInvoiceBodySchema,
  type USInvoicePayload,
} from "@/schemas/invoice.ts";
import { INVOICE_PARSER_PROMPT } from "@/prompts/invoice.ts";

const ai = new GoogleGenAI({ apiKey: GOOGLEAI_API_KEY });

type ApiResponse =
  | { success: true; invoices: USInvoicePayload[]; warnings?: string[] }
  | { error: string; details?: any };

interface ParseInvoiceBody {
  invoices: {
    imageId: string;
    imageBase64: string;
    mimeType: string;
  }[];
}

export const parseInvoice = async (
  req: Request<unknown, unknown, ParseInvoiceBody>,
  res: Response<ApiResponse>,
): Promise<ApiResponse | undefined> => {
  const bodyInvoiceParse = safeParse(ParseInvoiceBodySchema, req.body);
  if (!bodyInvoiceParse.success) {
    res.status(InvoiceStatusCode.BAD_REQUEST).json({
      error: "El cuerpo de la petición no es válido.",
      details: bodyInvoiceParse.issues,
    });
    return;
  }

  const { invoices } = bodyInvoiceParse.output;

  const results = await Promise.allSettled(
    invoices.map((invoice) => parseSingleInvoice(invoice)),
  );

  const successInvoices: USInvoicePayload[] = [];
  const warnings: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successInvoices.push(result.value);
    } else {
      warnings.push(
        `Error al procesar la factura #${index + 1}: ${result.reason.message}`,
      );
    }
  });

  if (successInvoices.length === 0) {
    res.status(InvoiceStatusCode.UNPROCESSABLE_ENTITY).json({
      error: "No se pudo procesar ninguna de las facturas.",
      details: warnings,
    });
    return;
  }

  res.json({
    success: true,
    invoices: successInvoices,
    warnings: warnings.length > 0 ? warnings : undefined,
  });
};

enum InvoiceStatusCode {
  SUCCESS = 200,
  BAD_REQUEST = 400,
  UNPROCESSABLE_ENTITY = 422,
}

const parseSingleInvoice = async (invoiceData: {
  imageId: string;
  imageBase64: string;
  mimeType: string;
}): Promise<USInvoicePayload> => {
  const { imageBase64, mimeType, imageId } = invoiceData;

  const { result, error } = await tryCatch(
    ai.models.generateContent({
      model: GOOGLEAI_MODEL,
      contents: [
        INVOICE_PARSER_PROMPT,
        {
          inlineData: {
            data: imageBase64,
            mimeType,
          },
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: GeminiInvoiceSchema,
      },
    }),
  );

  if (error) {
    throw new Error(`Error al procesar la factura: ${error.message}`);
  }

  const { text } = result || {};
  if (!text) {
    throw new Error("No se recibió texto de la IA.");
  }

  const parsedData = JSON.parse(text);
  const invoiceParse = safeParse(FacturaArgSchema, parsedData);

  if (!invoiceParse.success) {
    throw new Error(
      "La IA devolvió un formato que no coincide con el sistema destino.",
    );
  }

  const facturaArg = invoiceParse.output;
  const proveedor = facturaArg.proveedorNombre.toUpperCase();

  const totalExcludingTaxes = facturaArg.items.reduce((acc, item) => {
    if (proveedor.includes("COCA") || proveedor.includes("MOET") && item.ivaPorcentaje > 0) {
      const netoTotal = (item.precioUnitario - item.impuestosInternos) /
        (1 + item.ivaPorcentaje / 100);
      return acc + netoTotal;
    } else {
      return acc + (item.precioUnitario - item.impuestosInternos);
    }
  }, 0);

  const totalTaxes = facturaArg.ivaTotal + facturaArg.impuestosInternosTotal;
  const totalIncludingTaxes = totalExcludingTaxes + totalTaxes;

  let porcentajeImpIntPenaflor = 0;
  if (proveedor.includes("PEÑAFLOR") && facturaArg.subtotalNeto > 0) {
    porcentajeImpIntPenaflor = facturaArg.impuestosInternosTotal /
      facturaArg.subtotalNeto;
  }

  const itemsProcesados = facturaArg.items.map((item) => {
    let unitPriceWithIva = 0;
    let unitPriceWithoutIva = 0;

    const unidades = item.unidadesPorBulto ?? 1;
    const cantidadReal = item.cantidad * unidades;

    if (proveedor.includes("PEÑAFLOR")) {
      const importePorUnidad = item.precioUnitario / (item.cantidad * unidades);
      const ivaProporcional = importePorUnidad * (item.ivaPorcentaje / 100);
      const impIntProporcional = importePorUnidad * porcentajeImpIntPenaflor;

      unitPriceWithIva = importePorUnidad + ivaProporcional +
        impIntProporcional;
      unitPriceWithoutIva = importePorUnidad + impIntProporcional;
    } else if (
      proveedor.includes("DBA") ||
      proveedor.includes("DISTRIBUIDORA DE BEBIDAS SRL")
    ) {
      const precioBot = item.precioUnitario;
      const impIntPorUnidad = item.impuestosInternos / unidades;
      const factorIva = 1 + (item.ivaPorcentaje / 100);
      const precioSinImpuesto = (precioBot - impIntPorUnidad) / factorIva;

      unitPriceWithIva = precioBot;
      unitPriceWithoutIva = precioSinImpuesto + impIntPorUnidad;
    } else if (proveedor.includes("COCA") || proveedor.includes("MOET")) {
      const totalUnits = item.cantidad * unidades;

      if (item.ivaPorcentaje > 0) {
        unitPriceWithIva = item.precioUnitario / totalUnits;

        const netoTotal = (item.precioUnitario - item.impuestosInternos) / (1 + item.ivaPorcentaje / 100);
        const impIntPorUnidad = item.impuestosInternos / totalUnits;
        const netoPorUnidad = netoTotal / totalUnits;

        unitPriceWithoutIva = netoPorUnidad + impIntPorUnidad;
      } else {
        unitPriceWithoutIva = item.precioUnitario / totalUnits;
        unitPriceWithIva = unitPriceWithoutIva;
      }
    } else if (proveedor.includes("WINE")) {
      const precioNeto = item.precioUnitario;
      const ivaProporcional = precioNeto * (item.ivaPorcentaje / 100);

      unitPriceWithIva = precioNeto + ivaProporcional;
      unitPriceWithoutIva = precioNeto;
    } else if (proveedor.includes("QUILMES")) {
      const cantidadReal = item.cantidad * unidades;

      unitPriceWithIva = item.precioUnitario;
      unitPriceWithoutIva = item.ivaPorcentaje > 0
        ? item.precioUnitario - (item.precioUnitario * item.ivaPorcentaje / 100)
        : (item.precioUnitario + item.impuestosInternos) / cantidadReal;
    }
    else {
      const precioNeto = item.precioUnitario / unidades;
      const ivaProporcional = precioNeto * (item.ivaPorcentaje / 100);
      const impInternoUnitario = item.impuestosInternos / unidades;

      unitPriceWithIva = precioNeto + impInternoUnitario + ivaProporcional;
      unitPriceWithoutIva = precioNeto + impInternoUnitario;
    }

    return {
      description: item.insumo,
      quantityPurchased: Number(cantidadReal.toFixed(2)),
      unitPriceWithIva: Number(unitPriceWithIva.toFixed(2)),
      unitPriceWithoutIva: Number(unitPriceWithoutIva.toFixed(2)),
    };
  });

  return {
    imageId,
    vendorName: facturaArg.proveedorNombre,
    dateOfInvoice: facturaArg.fecha,
    invoiceNumber: facturaArg.numeroFactura,
    totalCostExcludingTaxes: Number(totalExcludingTaxes.toFixed(2)),
    totalTaxes: Number(totalTaxes.toFixed(2)),
    totalCostIncludingTaxes: Number(totalIncludingTaxes.toFixed(2)),
    items: itemsProcesados,
  };
};
