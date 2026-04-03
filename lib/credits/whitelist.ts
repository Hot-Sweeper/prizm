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
