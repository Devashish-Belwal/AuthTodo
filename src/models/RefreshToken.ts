import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByTokenId: { type: mongoose.Schema.Types.ObjectId, ref: "RefreshToken", default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.RefreshToken || mongoose.model("RefreshToken", RefreshTokenSchema);
