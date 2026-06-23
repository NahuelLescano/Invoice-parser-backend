import type { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { safeParse } from "valibot";
import { tryCatch } from "@/utils/tryCatch.ts";
import { GOOGLEAI_API_KEY } from "@/config/env.ts";
import { GeminiInvoiceSchema } from "@/schemas/geminiInvoice.ts";
import {
  ParseInvoiceBodySchema,
  USAInvoiceSystemSchema,
  type USInvoicePayload,
} from "@/schemas/invoice.ts";
import { INVOICE_PARSER_PROMPT } from "@/prompts/invoice.ts";

const ai = new GoogleGenAI({ apiKey: GOOGLEAI_API_KEY });

type ApiResponse =
  | { success: true; invoices: USInvoicePayload[]; warnings?: string[] }
  | { error: string; details?: any };

interface ParseInvoiceBody {
  invoices: {
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
  imageBase64: string;
  mimeType: string;
}): Promise<USInvoicePayload> => {
  const { imageBase64, mimeType } = invoiceData;

  const { result, error } = await tryCatch(
    ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
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

  const invoiceParse = safeParse(USAInvoiceSystemSchema, parsedData);

  if (!invoiceParse.success) {
    throw new Error(
      "La IA devolvió un formato que no coincide con el sistema destino.",
    );
  }

  const facturaArg = invoiceParse.output;
  const totalExcludingTaxes = facturaArg.items.reduce((acc, item) => {
    return acc + item.cantidad * item.precioUnitario;
  }, 0);

  const totalTaxes =
    facturaArg.ivaTotal +
    facturaArg.impuestosInternosTotal +
    facturaArg.percepcionesIva +
    facturaArg.percepcionesIibb;

  const totalIncludingTaxes =
    totalExcludingTaxes + totalTaxes + facturaArg.conceptosNoGravados;

  return {
    vendorName: facturaArg.proveedorNombre,
    dateOfInvoice: facturaArg.fecha,
    invoiceNumber: facturaArg.numeroFactura,
    totalCostExcludingTaxes: Number(totalExcludingTaxes.toFixed(2)),
    totalTaxes: Number(totalTaxes.toFixed(2)),
    totalCostIncludingTaxes: Number(totalIncludingTaxes.toFixed(2)),
    items: facturaArg.items.map((item) => ({
      description: item.insumo,
      quantityPurchased: item.cantidad,
      unitPrice: item.precioUnitario,
    })),
  };
};
