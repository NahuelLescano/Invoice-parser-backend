import { loadEnvFile } from "node:process";

loadEnvFile();

export const { PORT, GOOGLEAI_API_KEY, API_V1 = "/api/v1" } = process.env;
