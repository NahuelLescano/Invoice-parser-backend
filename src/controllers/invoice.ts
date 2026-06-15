import type { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { safeParse } from "valibot";
import { tryCatch } from "../tryCatch";
import { GOOGLEAI_API_KEY } from "../../config";
import {
  GeminiInvoiceSchema,
  ParseInvoiceBodySchema,
  USAInvoice,
  USAInvoiceSystemSchema,
} from "../schemas/invoice";

const ai = new GoogleGenAI({ apiKey: GOOGLEAI_API_KEY });

type ApiResponse =
  | { success: true; invoice: USAInvoice }
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

  const prompt = `
      Eres un extractor de datos de facturas optimizado para sistemas estándar internacionales. 
      Tu tarea es procesar la imagen de la factura argentina adjunta y extraer ÚNICAMENTE los campos solicitados, ignorando cualquier impuesto local complejo.

      Reglas de extracción:
      1. Extrae el nombre del proveedor (Razón Social), número de factura y fecha de emisión.
      2. Para cada ítem en la tabla de conceptos, extrae: descripción del insumo, cantidad, precio unitario y el porcentaje de IVA aplicado (este debe ser estrictamente 21 o 10.5).
      3. IMPORTANTE: Ignora por completo campos de "Impuestos Internos", "Percepciones de IIBB", "Percepciones de IVA" o "Conceptos No Gravados". No sumes estos valores a ningún otro campo.
      4. Devuelve la información estrictamente en formato JSON plano, sin bloques de código markdown, respetando la estructura del esquema requerido.
    `;

  const { result, error } = await tryCatch(
    ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [
        prompt,
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

  res.json({
    success: true,
    invoice: invoiceParse.output,
  });
};
