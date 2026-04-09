import "server-only";
import OpenAI from "openai";

let _client: OpenAI | undefined;

export function getCometClient(): OpenAI {
  _client ??= new OpenAI({
    apiKey: process.env.COMETAPI_API_KEY,
    baseURL: "https://api.cometapi.com/v1",
  });
  return _client;
}

// Lazy proxy so existing `cometClient.images.generate(...)` calls keep working
export const cometClient: OpenAI = new Proxy({} as OpenAI, {
  get(_, prop) {
    return (getCometClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
