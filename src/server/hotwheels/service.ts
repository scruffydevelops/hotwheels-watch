import { prisma } from "../db";
import { pollBlinkit, type BlinkitProduct } from "./blinkit";
import { pollZepto, type ZeptoProduct } from "./zepto";
import { pollBigBasket, type BigBasketProduct } from "./bigbasket";
import { sendNtfy, generateTopicName } from "../notify/ntfy";

const GENERIC_QUERY = "hot wheels";

// All platforms' product shapes are structurally identical for our purposes —
// this lets the matching/upsert logic below stay platform-agnostic.
type PlatformProduct = BlinkitProduct | ZeptoProduct | BigBasketProduct;
type PlatformName = "blinkit" | "zepto" | "bigbasket";

interface PlatformPollResult {
  resultsByQuery: { query: string; products: PlatformProduct[]; complete: boolean }[];
}

// Every platform is searched with just the generic "hot wheels" term. Wishlist
// items are NOT searched separately — earlier this ran one extra platform
// search per wishlist item, but a narrow term like "Aston Martin" often
// doesn't surface a product on a platform's own fuzzy search engine even
// though the product's name literally contains it (confirmed live: a product
// named "...Aston Martin Vantage GT3..." didn't come back for a search of
// just "Aston Martin"). Matching wishlist terms as a substring against the
// generic results we already have is strictly more reliable and needs no
// extra requests.
// Confirmed live: Blinkit's WAF returns a flat 403 for every request from
// Railway's IP range (even a bare homepage curl, no Playwright involved) —
// an IP-reputation block, same category as the Instamart block we hit
// locally, not something fixable by tuning headers/fingerprints. It works
// fine from a home connection, so it's only disabled where NODE_ENV is
// "production" (set in the Dockerfile for the hosted deploy) — local dev
// keeps Blinkit working as before.
const BLINKIT_ENABLED = process.env.NODE_ENV !== "production";

const ALL_PLATFORMS: { name: PlatformName; poll: (query: string, searchQueries: string[]) => Promise<PlatformPollResult> }[] = [
  { name: "blinkit", poll: pollBlinkit },
  { name: "zepto", poll: pollZepto },
  { name: "bigbasket", poll: pollBigBasket },
];
const PLATFORMS = BLINKIT_ENABLED ? ALL_PLATFORMS : ALL_PLATFORMS.filter((p) => p.name !== "blinkit");

// Location resolution on each platform (autocomplete calls, DOM clicks) is
// flaky enough that a poll fails outright with some regularity — confirmed
// live via repeated "[zepto] Check failed: ... couldn't resolve that
// address" / "[blinkit] ... autoSuggest failed: 500" entries in server logs
// even against addresses that resolve fine most of the time. When a poll
// fails, its platform gets no upsert at all that cycle, which also means the
// completeness-based downgrade never runs for it — one retry meaningfully
// improves how often a full cycle actually completes.
async function pollWithRetry(
  platform: (typeof PLATFORMS)[number],
  query: string,
  searchQueries: string[]
): Promise<PlatformPollResult> {
  try {
    return await platform.poll(query, searchQueries);
  } catch (err) {
    console.error(`[${platform.name}] Poll failed, retrying once:`, err);
    return platform.poll(query, searchQueries);
  }
}

// ---------- Auth ----------

// Finds the user for this Google account, or creates one on first sign-in.
// Google is the sole identity source now — there's no separate password to
// manage, so "log in" and "sign up" collapse into the same operation.
export async function findOrCreateGoogleUser(googleId: string, email: string): Promise<{ userId: string }> {
  const existing = await prisma.user.findUnique({ where: { googleId } });
  if (existing) return { userId: existing.id };

  const user = await prisma.user.create({
    data: { googleId, email: email.trim().toLowerCase(), ntfyTopic: generateTopicName() },
  });
  return { userId: user.id };
}

export async function getUserEmail(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  return user?.email ?? null;
}

// ---------- State ----------

export async function getState(userId: string) {
  const [addresses, wishlist, user] = await Promise.all([
    prisma.scalpAddress.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { products: { orderBy: { lastSeenAt: "desc" } } },
    }),
    prisma.wishlistItem.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.user.findUnique({ where: { id: userId }, select: { ntfyTopic: true, lastCheckedAt: true } }),
  ]);
  return { addresses, wishlist, ntfyTopic: user?.ntfyTopic ?? null, lastCheckedAt: user?.lastCheckedAt ?? null };
}

async function setLastCheckedAt(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { lastCheckedAt: new Date() } });
}

// This tracker is specifically for Hot Wheels — every result must actually be
// a Hot Wheels product, not just any toy that a platform's fuzzy search
// engine decided was "similar" once literal matches ran out.
function isHotWheelsBranded(p: PlatformProduct): boolean {
  return p.name.toLowerCase().includes("hot wheels");
}

// Wishlist matching is a plain substring check, so punctuation differences
// that don't change the model name at all — "MX-5" vs "MX 5", "Nissan GT-R"
// vs "Nissan GTR" — silently broke it (confirmed live: a "mazda mx 5"
// wishlist term missed a product literally named "...Mazda MX-5...").
// Collapsing hyphens/dashes to spaces and dropping repeated whitespace
// before comparing makes those equivalent without needing fuzzy matching.
function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/[-–—]/g, " ").replace(/\s+/g, " ").trim();
}

async function upsertProducts(
  addressId: string,
  platform: PlatformName,
  products: PlatformProduct[],
  complete: boolean,
  wishlistNames: string[]
) {
  let newCount = 0;
  let restockedCount = 0;
  const notable: PlatformProduct[] = []; // new or restocked — worth a notification
  const seenProductIds = new Set<string>();

  for (const p of products) {
    if (!isHotWheelsBranded(p)) continue; // discard fuzzy-search noise entirely
    seenProductIds.add(p.productId);

    const normalizedName = normalizeForMatch(p.name);
    const matchedWishlistName = wishlistNames.find((w) => normalizedName.includes(normalizeForMatch(w)));
    const sourceQuery = matchedWishlistName ?? GENERIC_QUERY;

    const existing = await prisma.trackedProduct.findUnique({
      where: { addressId_platform_productId: { addressId, platform, productId: p.productId } },
    });

    if (!existing) {
      newCount++;
      notable.push(p);
    } else if (!existing.inStock && p.inStock) {
      restockedCount++;
      notable.push(p);
    }

    await prisma.trackedProduct.upsert({
      where: { addressId_platform_productId: { addressId, platform, productId: p.productId } },
      create: {
        addressId,
        platform,
        productId: p.productId,
        name: p.name,
        brand: p.brand,
        price: p.price,
        mrp: p.mrp,
        inventory: p.inventory,
        imageUrl: p.imageUrl,
        productUrl: p.productUrl,
        inStock: p.inStock,
        sourceQuery,
      },
      update: {
        name: p.name,
        brand: p.brand,
        price: p.price,
        mrp: p.mrp,
        inventory: p.inventory,
        imageUrl: p.imageUrl,
        productUrl: p.productUrl,
        inStock: p.inStock,
        sourceQuery,
      },
    });
  }

  // Clean up any non-Hot-Wheels junk saved by a previous (buggy) poll. This is
  // name-based, not "missing from this poll" — fuzzy search isn't stable
  // between requests, so a genuine Hot Wheels item can legitimately be absent
  // from one particular poll's results. Deleting on absence would wipe real
  // (often out-of-stock) products just because the search didn't surface them
  // again; deleting on a failed name check only removes actual junk.
  await prisma.trackedProduct.deleteMany({
    where: {
      addressId,
      platform,
      NOT: { name: { contains: "hot wheels", mode: "insensitive" } },
    },
  });

  // If this poll saw the platform's FULL result set for the query (pagination
  // reached its own natural end, not our page cap — see `complete` on each
  // platform's poll function), a previously-tracked product that's genuinely
  // absent now is a reliable sign it went out of stock, not just paginated
  // out of reach. Confirmed live: without this, a Zepto/BigBasket item that
  // sold out kept showing "In stock" on the site forever, since neither
  // platform's search returns/keeps ranking out-of-stock items the same way,
  // so nothing ever told us it had changed. Downgrade, never delete — the
  // item is still worth showing, just no longer available.
  if (complete) {
    await prisma.trackedProduct.updateMany({
      where: {
        addressId,
        platform,
        inStock: true,
        productId: { notIn: Array.from(seenProductIds) },
      },
      data: { inStock: false },
    });
  }

  return { newCount, restockedCount, notable };
}

async function getWishlistNames(userId: string): Promise<string[]> {
  const wishlist = await prisma.wishlistItem.findMany({ where: { userId } });
  return wishlist.map((w) => w.name);
}

export interface AddAddressInput {
  label: string;
  city: string;
  addressText: string;
}

export async function addAddress(userId: string, { label, city, addressText }: AddAddressInput) {
  const trimmedLabel = label.trim();
  const trimmedCity = city.trim();
  const trimmedAddressText = addressText.trim();
  if (!trimmedLabel || !trimmedCity || !trimmedAddressText) {
    throw new Error("Label, city, and address are all required.");
  }

  const query = `${trimmedAddressText}, ${trimmedCity}`;
  const wishlistNames = await getWishlistNames(userId);

  const address = await prisma.scalpAddress.create({
    data: { userId, label: trimmedLabel, city: trimmedCity, addressText: trimmedAddressText, query },
  });

  // Blinkit resolves first (when enabled) and its coordinates are stored for
  // reference — nothing else in the app reads lat/lng, so this is skipped
  // entirely rather than left to fail when Blinkit is disabled.
  if (BLINKIT_ENABLED) {
    try {
      const blinkitResult = await pollBlinkit(query, [GENERIC_QUERY]).catch(() => pollBlinkit(query, [GENERIC_QUERY]));
      await prisma.scalpAddress.update({
        where: { id: address.id },
        data: { lat: blinkitResult.lat, lng: blinkitResult.lng },
      });
      await upsertProducts(
        address.id,
        "blinkit",
        blinkitResult.resultsByQuery[0]?.products ?? [],
        blinkitResult.resultsByQuery[0]?.complete ?? false,
        wishlistNames
      );
    } catch (err) {
      console.error("[blinkit] Failed during address creation:", err);
    }
  }

  // Other platforms don't cover every area Blinkit does — don't fail adding
  // the address just because one has no coverage there.
  for (const platform of PLATFORMS) {
    if (platform.name === "blinkit") continue;
    try {
      const result = await pollWithRetry(platform, query, [GENERIC_QUERY]);
      await upsertProducts(
        address.id,
        platform.name,
        result.resultsByQuery[0]?.products ?? [],
        result.resultsByQuery[0]?.complete ?? false,
        wishlistNames
      );
    } catch (err) {
      console.error(`[${platform.name}] Failed during address creation:`, err);
    }
  }

  return address;
}

// Verifies the address belongs to this user before touching it — without
// this check, any logged-in user could remove or trigger checks on another
// user's address just by guessing/enumerating ids.
async function assertOwnsAddress(userId: string, addressId: string) {
  const address = await prisma.scalpAddress.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) throw new Error("Address not found.");
  return address;
}

export async function removeAddress(userId: string, addressId: string) {
  await assertOwnsAddress(userId, addressId);
  await prisma.scalpAddress.delete({ where: { id: addressId } });
}

export interface CheckResult {
  newCount: number;
  restockedCount: number;
}

export async function checkAddress(userId: string, addressId: string): Promise<CheckResult> {
  const address = await assertOwnsAddress(userId, addressId);

  const wishlistNames = await getWishlistNames(userId);
  const notable: PlatformProduct[] = [];
  let newCount = 0;
  let restockedCount = 0;

  for (const platform of PLATFORMS) {
    try {
      const result = await pollWithRetry(platform, address.query, [GENERIC_QUERY]);
      const r = await upsertProducts(
        addressId,
        platform.name,
        result.resultsByQuery[0]?.products ?? [],
        result.resultsByQuery[0]?.complete ?? false,
        wishlistNames
      );
      newCount += r.newCount;
      restockedCount += r.restockedCount;
      notable.push(...r.notable);
    } catch (err) {
      console.error(`[${platform.name}] Check failed:`, err);
    }
  }

  await setLastCheckedAt(userId);

  if (notable.length > 0) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { ntfyTopic: true } });
    if (user) {
      const lines = notable.slice(0, 5).map((p) => `${p.name}${p.price ? ` — ₹${p.price}` : ""}\n${p.productUrl}`);
      if (notable.length > 5) lines.push(`...and ${notable.length - 5} more`);
      try {
        await sendNtfy(user.ntfyTopic, {
          title: `Hot Wheels — ${address.label}`,
          message: lines.join("\n\n"),
          // Max/urgent priority — ntfy's apps play a sound (and on Android,
          // show an insistent notification) by default at this level, unlike
          // the lower priorities which are silent by default. Plain "high"
          // (4) doesn't reliably make noise across clients.
          priority: 5,
          tags: ["rotating_light"],
          // Tapping the notification opens the product directly when there's just one;
          // with several, the message body above lists a link per product instead.
          click: notable.length === 1 ? notable[0].productUrl : undefined,
        });
      } catch (err) {
        console.error("[ntfy] Failed to send notification:", err);
      }
    }
  }

  return { newCount, restockedCount };
}

// Runs every saved address for every user, sequentially (one headless
// browser at a time per platform) to stay polite to every platform. Used
// only by the 5-minute cron — a single user triggering "Check all now"
// should only re-check their own addresses, not every account's (see
// checkAllAddressesForUser below).
export async function checkAllAddresses(): Promise<Record<string, CheckResult | { error: string }>> {
  const addresses = await prisma.scalpAddress.findMany({ select: { id: true, userId: true } });
  return checkMany(addresses);
}

export async function checkAllAddressesForUser(userId: string): Promise<Record<string, CheckResult | { error: string }>> {
  const addresses = await prisma.scalpAddress.findMany({ where: { userId }, select: { id: true, userId: true } });
  return checkMany(addresses);
}

async function checkMany(addresses: { id: string; userId: string }[]) {
  const results: Record<string, CheckResult | { error: string }> = {};
  for (const { id, userId } of addresses) {
    try {
      results[id] = await checkAddress(userId, id);
    } catch (err) {
      results[id] = { error: err instanceof Error ? err.message : "Check failed." };
    }
  }
  return results;
}

export async function addWishlistItem(userId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Wishlist item name is required.");
  const item = await prisma.wishlistItem.create({ data: { userId, name: trimmed } });

  // Match against products already sitting in the DB from past checks, rather
  // than waiting for the next poll cycle — the term might match things we've
  // already seen. Only touches rows still tagged with the generic query, on
  // addresses belonging to this user, so it never overwrites a product
  // that's already tied to a different wishlist term or another user's data.
  // Filtered in JS (not a DB-level `contains`) so it can use the same
  // hyphen/whitespace-normalized comparison as the live poll match —
  // Postgres ILIKE alone would miss "Mazda MX-5" for a "mazda mx 5" term.
  const candidates = await prisma.trackedProduct.findMany({
    where: { sourceQuery: GENERIC_QUERY, address: { userId } },
    select: { id: true, name: true },
  });
  const normalizedTerm = normalizeForMatch(trimmed);
  const matchingIds = candidates.filter((c) => normalizeForMatch(c.name).includes(normalizedTerm)).map((c) => c.id);
  if (matchingIds.length > 0) {
    await prisma.trackedProduct.updateMany({
      where: { id: { in: matchingIds } },
      data: { sourceQuery: trimmed },
    });
  }

  return item;
}

export async function removeWishlistItem(userId: string, id: string) {
  const item = await prisma.wishlistItem.findUnique({ where: { id } });
  if (!item || item.userId !== userId) throw new Error("Wishlist item not found.");
  await prisma.wishlistItem.delete({ where: { id } });
}

export async function getNtfyTopicForUser(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { ntfyTopic: true } });
  if (!user) throw new Error("User not found.");
  return user.ntfyTopic;
}
