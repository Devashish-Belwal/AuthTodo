import { hashRefreshToken, generateRefreshToken, refreshExpiresMs } from "@/lib/refresh-token";
import { signAccessToken } from "@/lib/tokens";
import dbConnect from "@/lib/mongodb";
import RefreshToken from "@/models/RefreshToken";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/refresh_token=([^;]+)/);
    const rawToken = match ? match[1] : null;
    if (!rawToken) return Response.json({ error: "Missing refresh token" }, { status: 401 });

    const hash = hashRefreshToken(rawToken);
    const record = await RefreshToken.findOne({ tokenHash: hash });
    if (!record) return Response.json({ error: "Invalid refresh token" }, { status: 401 });

    // Reuse detection (persisted separately from rotation transaction)
    if (record.revokedAt && record.replacedByTokenId) {
      const reuseSession = await mongoose.startSession();
      reuseSession.startTransaction();
      try {
        let current = await RefreshToken.findById(record.replacedByTokenId).session(reuseSession);
        while (current && !current.revokedAt) {
          current.revokedAt = new Date();
          await current.save({ session: reuseSession });
          current = current.replacedByTokenId ? await RefreshToken.findById(current.replacedByTokenId).session(reuseSession) : null;
        }
        await reuseSession.commitTransaction();
        reuseSession.endSession();
      } catch {
        await reuseSession.abortTransaction(); reuseSession.endSession();
        return Response.json({ error: "Refresh failed" }, { status: 500 });
      }
      return Response.json({ error: "Token reuse detected" }, { status: 401 });
    }

    if (record.revokedAt || record.expiresAt < new Date()) {
      return Response.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const activeRecord = await RefreshToken.findOne({ tokenHash: hash }).session(session);
      if (!activeRecord || activeRecord.revokedAt || activeRecord.expiresAt < new Date()) {
        await session.abortTransaction(); session.endSession();
        return Response.json({ error: "Invalid refresh token" }, { status: 401 });
      }

      const user = await User.findById(activeRecord.userId).session(session);
      if (!user) { await session.abortTransaction(); session.endSession(); return Response.json({ error: "User not found" }, { status: 401 }); }

      const newRaw = generateRefreshToken();
      const newHash = hashRefreshToken(newRaw);
      const expiresMs = refreshExpiresMs();

      const newRecordArr = await RefreshToken.create([{
        userId: activeRecord.userId,
        tokenHash: newHash,
        expiresAt: new Date(Date.now() + expiresMs),
        replacedByTokenId: null,
      }], { session });

      activeRecord.revokedAt = new Date();
      activeRecord.replacedByTokenId = newRecordArr[0]._id;
      await activeRecord.save({ session });

      await session.commitTransaction();
      session.endSession();

      const accessToken = await signAccessToken(user._id.toString());

      return new Response(JSON.stringify({ accessToken }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `refresh_token=${newRaw}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.round(expiresMs / 1000)}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
        },
      });
    } catch (txErr: any) {
      await session.abortTransaction();
      session.endSession();
      throw txErr;
    }
  } catch (e: any) {
    return Response.json({ error: "Refresh failed" }, { status: 500 });
  }
}
