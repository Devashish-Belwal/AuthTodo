import { createHash, randomBytes } from "crypto";
import { parseDuration } from "./duration";

export function generateRefreshToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function refreshExpiresMs(): number {
  const val = process.env.REFRESH_TOKEN_EXPIRES_IN;
  if (!val) throw new Error("REFRESH_TOKEN_EXPIRES_IN not set");
  return parseDuration(val);
}
