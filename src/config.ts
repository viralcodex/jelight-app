import "dotenv/config";

/** Server + model deployment configuration, read once from the environment. */
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 0 || port > 65_535) {
  throw new Error("PORT must be an integer between 0 and 65535");
}

export const PORT = port;

/** Model id passed to the Vercel AI Gateway adapter. */
export const MODEL = process.env.AI_MODEL?.trim() || "typesafe-ai/jev";

