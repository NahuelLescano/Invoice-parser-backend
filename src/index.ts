import express, { type Request, type Response } from "express";
import { PORT, API_V1 } from "./config/env";
import { invoiceRouter } from "./routes/invoice";
import { middlewares } from "./middleware";

const server = express();

server.use(middlewares);

server.get("/health", (_req: Request, res: Response) => {
  res.json("Ok");
});

server.use(`${API_V1}/invoice`, invoiceRouter);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log(`Invoice endpoint available at http://localhost:${PORT}${API_V1}/invoice`);
});
