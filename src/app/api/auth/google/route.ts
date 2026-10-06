import { OAuth2Client } from "google-auth-library";
import { randomBytes } from "crypto";

const clientId = process.env.GOOGLE_CLIENT_ID || "";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";

const oauthClient = new OAuth2Client(clientId, clientSecret, redirectUri);

export async function GET() {
  const state = randomBytes(32).toString("hex");
  const authUrl = oauthClient.generateAuthUrl({
    access_type: "offline",
    state,
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl,
      "Set-Cookie": `oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600${redirectUri.includes("localhost") ? "" : "; Secure"}`,
    },
  });
}
