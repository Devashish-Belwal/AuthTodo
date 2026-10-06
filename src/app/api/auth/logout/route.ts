import { hashRefreshToken } from "@/lib/refresh-token";
import dbConnect from "@/lib/mongodb";
import RefreshToken from "@/models/RefreshToken";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/refresh_token=([^;]+)/);
    const rawToken = match ? match[1] : null;
    if (rawToken) {
      const hash = hashRefreshToken(rawToken);
      const record = await RefreshToken.findOne({ tokenHash: hash });
      if (record && !record.revokedAt) {
        record.revokedAt = new Date();
        await record.save();
      }
    }
    const clearCookie = "refresh_token=; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=0";
    return Response.json({ ok: true }, { status: 200, headers: { "Set-Cookie": clearCookie } });
  } catch {
    return Response.json({ error: "Logout failed" }, { status: 500 });
  }
}
