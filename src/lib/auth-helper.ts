import { verifyAccessToken } from "./tokens";

export async function getAuthUserId(req: Request): Promise<string> {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/Bearer\s+(\S+)/);
  if (!match) throw new Error("No token");
  return verifyAccessToken(match[1]);
}
