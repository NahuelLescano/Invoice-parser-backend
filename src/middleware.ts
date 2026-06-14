import express from "express";
import cors from "cors";
import morgan from "morgan";

export const middlewares = express();

middlewares.use(cors());
middlewares.use(express.json({ limit: "10mb" }));
middlewares.use(express.urlencoded({ limit: "10mb", extended: true }));
middlewares.use(morgan("dev"));
