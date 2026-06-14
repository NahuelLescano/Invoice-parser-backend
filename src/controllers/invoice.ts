import { GoogleGenAI } from "@google/genai";
import { GOOGLEAI_API_KEY } from "../../config";
import type { Request, Response } from "express";

const ai = new GoogleGenAI({ apiKey: GOOGLEAI_API_KEY });

export const parseInvoice = async (req: Request, res: Response) => {
  const { imageBase64, mimeType } = req.body;

  if (!imageBase64 || !mimeType) {
    res.status(400).json({
      error: "Faltan parámetros: imageBase64 y mimeType son requeridos.",
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

  let responseAI;
  try {
    responseAI = await ai.models.generateContent({
      model: "gemini-1.5-flash",
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
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      res
        .status(422)
        .json({ error: `Error al procesar la factura: ${error.message}` });
      return;
    }
    res
      .status(500)
      .json({ error: "Error desconocido al procesar la factura." });
  }

  const { text } = responseAI || {};
  if (!text) {
    res.status(500).json({ error: "No se recibió texto de la IA." });
    return;
  }

  const parsedData = JSON.parse(text);

  res.json({
    success: true,
    invoice: parsedData,
  });
};
