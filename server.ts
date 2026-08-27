import "dotenv/config";
import express from "express";
import path from "node:path";
import {
  getState,
  addAddress,
  removeAddress,
  checkAddress,
  checkAllAddresses,
  addWishlistItem,
  removeWishlistItem,
  getNtfyTopic,
} from "./src/server/hotwheels/service";
import { sendNtfy } from "./src/server/notify/ntfy";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // auto-check every 5 minutes

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/state", async (_req, res) => {
  try {
    res.json(await getState());
  } catch (err) {
    res.status(500).json({ error: message(err) });
  }
});

app.post("/api/addresses", async (req, res) => {
  try {
    const { label, city, addressText } = req.body ?? {};
    const address = await addAddress({ label, city, addressText });
    res.json({ ok: true, address });
  } catch (err) {
    res.status(400).json({ ok: false, error: message(err) });
  }
});

app.delete("/api/addresses/:id", async (req, res) => {
  try {
    await removeAddress(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: message(err) });
  }
});

app.post("/api/addresses/:id/check", async (req, res) => {
  try {
    const result = await checkAddress(req.params.id);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: message(err) });
  }
});

app.post("/api/check-all", async (_req, res) => {
  try {
    res.json({ ok: true, results: await checkAllAddresses() });
  } catch (err) {
    res.status(500).json({ ok: false, error: message(err) });
  }
});

app.post("/api/wishlist", async (req, res) => {
  try {
    const item = await addWishlistItem(req.body?.name ?? "");
    res.json({ ok: true, item });
  } catch (err) {
    res.status(400).json({ ok: false, error: message(err) });
  }
});

app.delete("/api/wishlist/:id", async (req, res) => {
  try {
    await removeWishlistItem(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: message(err) });
  }
});

app.post("/api/notify-test", async (_req, res) => {
  try {
    const topic = await getNtfyTopic();
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
