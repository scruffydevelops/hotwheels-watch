// Minimal OAuth 2.0 authorization-code flow against Google, implemented by
// hand (no passport/next-auth) since this is a plain Express app and the
// flow itself is only a few HTTP calls. Uses the userinfo endpoint rather
// than verifying the id_token's JWT signature — simpler, and avoids pulling
// in a JWKS/JWT-verification dependency for a single-purpose login flow.
import { randomBytes } from "node:crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

function getClientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) throw new Error("GOOGLE_CLIENT_ID is not set.");
  return id;
}

function getClientSecret(): string {
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) throw new Error("GOOGLE_CLIENT_SECRET is not set.");
  return secret;
}

export function generateOAuthState(): string {
  return randomBytes(16).toString("hex");
}

export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email",
    state,
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

interface GoogleProfile {
  googleId: string;
  email: string;
}

export async function exchangeCodeForProfile(code: string, redirectUri: string): Promise<GoogleProfile> {
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) throw new Error(`Google token exchange failed: ${tokenRes.status}`);
  const tokenJson: any = await tokenRes.json();

  const userinfoRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!userinfoRes.ok) throw new Error(`Google userinfo fetch failed: ${userinfoRes.status}`);
  const profile: any = await userinfoRes.json();

  if (!profile.sub || !profile.email) throw new Error("Google didn't return a usable profile.");
  return { googleId: profile.sub, email: profile.email };
}
