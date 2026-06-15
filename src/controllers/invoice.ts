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
  | { success: true; invoice: USInvoicePayload }
  | { error: string; details?: any };

interface ParseInvoiceBody {
  imageBase64: string;
  mimeType: string;
}

export const parseInvoice = async (
  req: Request<unknown, unknown, ParseInvoiceBody>,
  res: Response<ApiResponse>,
): Promise<void> => {
  const { imageBase64, mimeType } = req.body;

  const bodyInvoiceParse = safeParse(ParseInvoiceBodySchema, req.body);
  if (!bodyInvoiceParse.success) {
    res.status(400).json({
      error: "El cuerpo de la petición no es válido.",
      details: bodyInvoiceParse.issues,
    });
    return;
  }

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
    res
      .status(422)
      .json({ error: `Error al procesar la factura: ${error.message}` });
    return;
  }

  const { text } = result || {};
  if (!text) {
    res.status(500).json({ error: "No se recibió texto de la IA." });
    return;
  }

  const parsedData = JSON.parse(text);

  const invoiceParse = safeParse(USAInvoiceSystemSchema, parsedData);

  if (!invoiceParse.success) {
    res.status(422).json({
      error:
        "La IA devolvió un formato que no coincide con el sistema destino.",
      details: invoiceParse.issues,
    });
    return;
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

  const usSystemPayload: USInvoicePayload = {
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
      // Si algun dia hay mas impuestos por item, se pueden agregar aca
    })),
  };

  res.json({
    success: true,
    invoice: usSystemPayload,
  });
};
