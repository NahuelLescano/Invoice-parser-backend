import { Router } from "express";
import { parseInvoice } from "@/controllers/invoice.ts";

export const invoiceRouter = Router();

invoiceRouter.post("/", parseInvoice);
