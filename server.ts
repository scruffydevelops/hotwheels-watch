import "dotenv/config";
import express from "express";
import path from "node:path";
import {
  getState,
  addAddress,
  removeAddress,
  checkAddress,
  checkAllAddresses,
  checkAllAddressesForUser,
  addWishlistItem,
  removeWishlistItem,
  getNtfyTopicForUser,
  findOrCreateGoogleUser,
  getUserEmail,
} from "./src/server/hotwheels/service";
import { sendNtfy } from "./src/server/notify/ntfy";
import {
  getUserIdFromRequest,
  setSessionCookie,
  clearSessionCookie,
  setOAuthStateCookie,
  readAndClearOAuthStateCookie,
} from "./src/server/auth";
import { generateOAuthState, buildGoogleAuthUrl, exchangeCodeForProfile } from "./src/server/google-oauth";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // auto-check every 5 minutes

// Railway (like most PaaS) terminates TLS at its edge and forwards to the
// container over plain HTTP — without this, req.protocol always reports
// "http" even on the public https:// URL, which would build a Google
// redirect_uri that doesn't match what's registered in Google Cloud Console.
app.set("trust proxy", 1);

app.use(express.json());

// Every /api response depends on the caller's session cookie, but Express
// auto-generates an ETag on JSON bodies regardless — without this, the
// logged-out {"loggedIn":false} response from /api/auth/me gets cached
// (by the browser, and/or Railway's edge) and keeps getting served back as
// a 304 even after a real, successful login, since 304 revalidation only
// looks at the URL/ETag, not the Cookie header. Confirmed live: after
// switching to Google sign-in, the server-side session was correct on every
// request, but the client kept seeing the stale pre-login response and
// never left the login screen.
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use(express.static(path.join(__dirname, "public")));

// ---------- Auth ----------

function googleRedirectUri(req: express.Request): string {
  return `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
}

app.get("/api/auth/google", (req, res) => {
  try {
    const state = generateOAuthState();
    setOAuthStateCookie(res, state);
    res.redirect(buildGoogleAuthUrl(googleRedirectUri(req), state));
  } catch (err) {
    res.status(500).send(message(err));
  }
});

app.get("/api/auth/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    const expectedState = readAndClearOAuthStateCookie(req, res);
    if (!state || state !== expectedState) throw new Error("Invalid OAuth state — please try signing in again.");
    if (typeof code !== "string") throw new Error("Google didn't return an authorization code.");

    const profile = await exchangeCodeForProfile(code, googleRedirectUri(req));
    const { userId } = await findOrCreateGoogleUser(profile.googleId, profile.email);
    setSessionCookie(res, userId);
    res.redirect("/");
  } catch (err) {
    console.error("[google-oauth] Sign-in failed:", err);
    res.redirect(`/?auth_error=${encodeURIComponent(message(err))}`);
  }
});

app.post("/api/auth/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get("/api/auth/me", async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.json({ loggedIn: false });
  const email = await getUserEmail(userId);
  if (!email) return res.json({ loggedIn: false });
  res.json({ loggedIn: true, email });
});

// Everything below requires a logged-in user — attaches userId onto the
// request so route handlers don't each have to re-check.
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ ok: false, error: "Not logged in." });
  (req as express.Request & { userId: string }).userId = userId;
  next();
}

function userIdOf(req: express.Request): string {
  return (req as express.Request & { userId: string }).userId;
}

// ---------- App data ----------

app.get("/api/state", requireAuth, async (req, res) => {
  try {
    res.json(await getState(userIdOf(req)));
  } catch (err) {
    res.status(500).json({ error: message(err) });
  }
});

app.post("/api/addresses", requireAuth, async (req, res) => {
  try {
    const { label, city, addressText } = req.body ?? {};
    const address = await addAddress(userIdOf(req), { label, city, addressText });
    res.json({ ok: true, address });
  } catch (err) {
    res.status(400).json({ ok: false, error: message(err) });
  }
});

app.delete("/api/addresses/:id", requireAuth, async (req, res) => {
  try {
    await removeAddress(userIdOf(req), req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: message(err) });
  }
});

app.post("/api/addresses/:id/check", requireAuth, async (req, res) => {
  try {
    const result = await checkAddress(userIdOf(req), req.params.id);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: message(err) });
  }
});

app.post("/api/check-all", requireAuth, async (req, res) => {
  try {
    res.json({ ok: true, results: await checkAllAddressesForUser(userIdOf(req)) });
  } catch (err) {
    res.status(500).json({ ok: false, error: message(err) });
  }
});

app.post("/api/wishlist", requireAuth, async (req, res) => {
  try {
    const item = await addWishlistItem(userIdOf(req), req.body?.name ?? "");
    res.json({ ok: true, item });
  } catch (err) {
    res.status(400).json({ ok: false, error: message(err) });
  }
});

app.delete("/api/wishlist/:id", requireAuth, async (req, res) => {
  try {
    await removeWishlistItem(userIdOf(req), req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: message(err) });
  }
});

app.post("/api/notify-test", requireAuth, async (req, res) => {
  try {
    const topic = await getNtfyTopicForUser(userIdOf(req));
    await sendNtfy(topic, {
      title: "Hot Wheels Watch",
      message: "Test notification — if you see this, it's working!",
      priority: 5,
      tags: ["rotating_light"],
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: message(err) });
  }
});

function message(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}

app.listen(PORT, () => {
  console.log(`Hot Wheels Watch running at http://localhost:${PORT}`);

  setInterval(() => {
    console.log("[auto-check] polling all saved addresses...");
    checkAllAddresses()
      .then((results) => console.log("[auto-check] done:", results))
      .catch((err) => console.error("[auto-check] failed:", err));
  }, CHECK_INTERVAL_MS);
});
