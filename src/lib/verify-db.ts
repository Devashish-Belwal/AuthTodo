import dbConnect from "./mongodb";

export async function verifyDB(): Promise<boolean> {
  try {
    const mongoose = await dbConnect();
    await mongoose.connection.db?.admin().ping();
    return true;
  } catch {
    return false;
  }
}
