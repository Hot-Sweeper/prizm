import "server-only";

const whitelistedEmails = new Set(
  (process.env.WHITELISTED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

export function isWhitelistedEmail(email: string | null | undefined): boolean {
  if (!email || whitelistedEmails.size === 0) return false;
  return whitelistedEmails.has(email.toLowerCase());
}

export function isLocalhostRequestUrl(requestUrl: string): boolean {
  try {
    const { hostname } = new URL(requestUrl);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export function isWhitelistedForRequest(email: string | null | undefined, requestUrl: string): boolean {
  return isWhitelistedEmail(email) || isLocalhostRequestUrl(requestUrl);
}
