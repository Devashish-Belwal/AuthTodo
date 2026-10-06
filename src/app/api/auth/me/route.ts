import { getAuthUserId } from "@/lib/auth-helper";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    const userId = await getAuthUserId(req);
    await dbConnect();
    const user = await User.findById(userId).select("_id email name avatarUrl");
    if (!user) return Response.json({ error: "User not found" }, { status: 401 });
    return Response.json({ user: { id: user._id.toString(), email: user.email, name: user.name, avatarUrl: user.avatarUrl || null } });
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
}
