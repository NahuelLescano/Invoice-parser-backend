import { EnvSchema } from "@/schemas/env.ts";
import { loadEnvFile } from "node:process";
import { parse } from "valibot";

loadEnvFile();

const env = parse(EnvSchema, {
  PORT: process.env.PORT,
  GOOGLEAI_API_KEY: process.env.GOOGLEAI_API_KEY,
  GOOGLEAI_MODEL: process.env.GOOGLEAI_MODEL,
  API_V1: process.env.API_V1 ?? "/api/v1",
});

export const {
  PORT,
  GOOGLEAI_API_KEY,
  GOOGLEAI_MODEL,
  API_V1,
} = env;
