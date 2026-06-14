import express, { type Request, type Response } from "express";
import cors from "cors";
import morgan from "morgan";

export const middlewares = express();

middlewares.use(cors());
middlewares.use(express.json({ limit: "10mb" }));
middlewares.use(express.urlencoded({ limit: "10mb", extended: true }));
middlewares.use(morgan("dev"));

middlewares.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    mensaje: `La ruta ${req.method}: ${req.originalUrl} no existe en este servidor.`,
    rutasValidas: [
      {
        metodo: "POST",
        path: "/api/invoices/parse",
        descripcion: "Sube una imagen en Base64 para extraer los datos de la factura."
      }
    ]
  });
});
