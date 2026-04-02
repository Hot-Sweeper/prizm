import "server-only";
import OpenAI from "openai";

// Singleton — reused across requests in the same Node.js process
export const cometClient = new OpenAI({
  apiKey: process.env.COMETAPI_API_KEY,
  baseURL: "https://api.cometapi.com/v1",
});
