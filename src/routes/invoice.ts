import { Router } from "express";
import { parseInvoice } from "../controllers/invoice";

export const invoiceRouter = Router();

invoiceRouter.post("/", parseInvoice);
