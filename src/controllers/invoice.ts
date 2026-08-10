import type { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { safeParse } from "valibot";
import { tryCatch } from "@/utils/tryCatch.ts";
import { findCalculator } from "@/utils/calculator.ts";
import { GOOGLEAI_API_KEY, GOOGLEAI_MODEL } from "@/config/env.ts";
import { GeminiInvoiceSchema } from "@/schemas/geminiInvoice.ts";
import {
  FacturaArg,
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
    res.status(400).json({
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
    res.status(422).json({
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

const parseSingleInvoice = async (invoiceData: {
  imageId: string;
  imageBase64: string;
  mimeType: string;
}): Promise<USInvoicePayload> => {
  const { imageBase64, mimeType, imageId } = invoiceData;

  const facturaArg = await parseGeneratedContent({ imageBase64, mimeType });
  const proveedor = facturaArg.proveedorNombre.toUpperCase();

  const calculator = findCalculator(proveedor);

  const itemsProcesados = facturaArg.items.map((item) => {
    const result = calculator(item, facturaArg);

    const cantidadReal = item.cantidad * (item.unidadesPorBulto ?? 1);

    return {
      description: item.insumo,
      quantityPurchased: Number(cantidadReal.toFixed(2)),
      unitPriceWithIva: Number(result.unitPriceWithIva.toFixed(2)),
      unitPriceWithoutIva: Number(result.unitPriceWithoutIva.toFixed(2)),
    };
  });

  const totalExcludingTaxes = facturaArg.items.reduce((acc, item) => {
    const result = calculator(item, facturaArg);
    return acc + result.totalCostExcludingTaxes;
  }, 0);

  const totalTaxes = facturaArg.ivaTotal + facturaArg.impuestosInternosTotal;
  const totalIncludingTaxes = totalExcludingTaxes + totalTaxes;

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

const parseGeneratedContent = async ({ imageBase64, mimeType }: {
  imageBase64: string;
  mimeType: string;
}): Promise<FacturaArg> => {
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

  return invoiceParse.output;
}
