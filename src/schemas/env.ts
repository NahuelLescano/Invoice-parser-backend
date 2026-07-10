import { object, string } from "valibot";

export const envSchema = object({
  PORT: string(),
  GOOGLEAI_API_KEY: string(),
  GOOGLEAI_MODEL: string(),
  API_V1: string(),
});
