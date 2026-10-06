export function parseDuration(str: string): number {
  if (!str) throw new Error("REFRESH_TOKEN_EXPIRES_IN not set");
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error("Invalid REFRESH_TOKEN_EXPIRES_IN format");
  const n = parseInt(match[1], 10);
  switch (match[2]) {
    case "s": return n * 1000;
    case "m": return n * 60 * 1000;
    case "h": return n * 60 * 60 * 1000;
    case "d": return n * 24 * 60 * 60 * 1000;
    default: throw new Error("Invalid REFRESH_TOKEN_EXPIRES_IN unit");
  }
}
