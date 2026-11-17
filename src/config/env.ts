import { EnvSchema } from "@/schemas/env.ts";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { parse } from "valibot";

if (existsSync(".env")) {
  loadEnvFile();
}

const env = parse(EnvSchema, {
  PORT: process.env.PORT,
  AI_API_KEY: process.env.AI_API_KEY,
  AI_MODEL: process.env.AI_MODEL,
  API_V1: process.env.API_V1 ?? "/api/v1",
});

export const {
  PORT,
  AI_API_KEY,
  AI_MODEL,
  API_V1,
} = env;
