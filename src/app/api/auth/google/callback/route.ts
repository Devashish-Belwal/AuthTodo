import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";
import { timingSafeEqual } from "crypto";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import RefreshToken from "@/models/RefreshToken";
import { generateRefreshToken, hashRefreshToken, refreshExpiresMs } from "@/lib/refresh-token";

const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";
const oauthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "", process.env.GOOGLE_CLIENT_SECRET || "", redirectUri);

function clearCookie() {
  return "oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0";
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");

    const cookieHeader = req.headers.get("cookie") || "";
    const stateCookieMatch = cookieHeader.match(/oauth_state=([^;]+)/);
    const stateCookie = stateCookieMatch ? stateCookieMatch[1] : null;

    if (!stateParam || !stateCookie) {
      return new Response("Invalid state", { status: 400, headers: { "Set-Cookie": clearCookie() } });
    }

    const stateBuf = Buffer.from(stateParam, "hex");
    const cookieBuf = Buffer.from(stateCookie, "hex");
    if (stateBuf.length !== cookieBuf.length || !timingSafeEqual(stateBuf, cookieBuf)) {
      return new Response("Invalid state", { status: 400, headers: { "Set-Cookie": clearCookie() } });
    }

    if (!code) return new Response("Missing code", { status: 400, headers: { "Set-Cookie": clearCookie() } });

    const { tokens } = await oauthClient.getToken(code);
    oauthClient.setCredentials(tokens);

    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) return new Response("Invalid token", { status: 401, headers: { "Set-Cookie": clearCookie() } });
    if (payload.email_verified !== true) return new Response("Email not verified", { status: 403, headers: { "Set-Cookie": clearCookie() } });

    await dbConnect();

    const googleId = payload.sub!;
    const email = payload.email!;
    const name = payload.name || "";
    const avatarUrl = payload.picture || "";

    let user = await User.findOne({ googleId });
    if (!user) {
      const existing = await User.findOne({ email });
      if (existing) {
        existing.googleId = googleId;
        existing.name = name;
        existing.avatarUrl = avatarUrl;
        await existing.save();
        user = existing;
      } else {
        user = await User.create({ googleId, email, name, avatarUrl });
      }
    } else {
      user.name = name;
      user.avatarUrl = avatarUrl;
      await user.save();
    }

    // Create initial refresh token session
    const rawRefreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(rawRefreshToken);
    const expiresMs = refreshExpiresMs();
    await RefreshToken.create({
      userId: user._id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + expiresMs),
      revokedAt: null,
      replacedByTokenId: null,
    });

    const cookieConfig = `refresh_token=${rawRefreshToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.round(expiresMs / 1000)}`;
    const isLocalhost = redirectUri.includes("localhost") || process.env.NODE_ENV === "development";
    const finalCookie = isLocalhost ? cookieConfig : cookieConfig + "; Secure";

    const headers = new Headers();
    headers.set("Location", new URL("/todos", req.url).toString());
    headers.append("Set-Cookie", clearCookie());
    headers.append("Set-Cookie", finalCookie);

    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (e: any) {
    return new Response("Auth error: " + e.message, { status: 500, headers: { "Set-Cookie": clearCookie() } });
  }
}
