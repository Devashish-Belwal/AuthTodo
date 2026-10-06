import { SignJWT, jwtVerify } from "jose";

function getSecret() {
  const secretRaw = process.env.ACCESS_TOKEN_SECRET;
  if (!secretRaw) throw new Error("ACCESS_TOKEN_SECRET is not set");
  return new TextEncoder().encode(secretRaw);
}

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.ACCESS_TOKEN_EXPIRES_IN || "15m")
    .sign(getSecret());
}

export async function verifyAccessToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, getSecret(), { clockTolerance: 30 });
  if (payload.type !== "access" || typeof payload.sub !== "string") throw new Error("Invalid token");
  return payload.sub;
}
