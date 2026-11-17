import { object, string } from "valibot";

export const EnvSchema = object({
  PORT: string(),
  AI_API_KEY: string(),
  AI_MODEL: string(),
  API_V1: string(),
});
