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
  signUp,
  logIn,
  getUserEmail,
} from "./src/server/hotwheels/service";
import { sendNtfy } from "./src/server/notify/ntfy";
import { getUserIdFromRequest, setSessionCookie, clearSessionCookie } from "./src/server/auth";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // auto-check every 5 minutes

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- Auth ----------

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    const { userId } = await signUp(email, password);
    setSessionCookie(res, userId);
    res.json({ ok: true, email: email.trim().toLowerCase() });
  } catch (err) {
    res.status(400).json({ ok: false, error: message(err) });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    const { userId } = await logIn(email, password);
    setSessionCookie(res, userId);
    res.json({ ok: true, email: email.trim().toLowerCase() });
  } catch (err) {
    res.status(400).json({ ok: false, error: message(err) });
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
