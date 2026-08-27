// Reverse-engineered from blinkit.com's own web frontend (captured via DevTools
// network tab). No official public API exists for Blinkit — these endpoints are
// undocumented and can change at any time.
//
// A bare server-to-server fetch to these endpoints gets a flat 403 (bot
// detection), even with full browser-like headers. So instead we drive a real
// headless Chromium session: load blinkit.com for real (cookies, JS challenges,
// TLS fingerprint all genuine), then call the same JSON endpoints via
// page.evaluate(fetch(...)) so the requests carry that page's real session.
import { chromium, type Page } from "playwright";

const BLINKIT_ORIGIN = "https://blinkit.com";
const MAX_PAGES_PER_QUERY = 15; // safety cap so one poll can't spiral into hundreds of requests

export interface BlinkitProduct {
  productId: string;
  name: string;
  brand?: string;
  price?: number;
  mrp?: number;
  inventory?: number;
  imageUrl?: string;
  inStock: boolean;
  productUrl: string;
}

// Blinkit's product page routes purely on the id — /prn/<anything>/prid/<id>
// resolves correctly regardless of the slug, confirmed live (tried both the
// real name-derived slug and a garbage one; both loaded the right product).
function blinkitProductUrl(productId: string, name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";
  return `${BLINKIT_ORIGIN}/prn/${slug}/prid/${productId}`;
}

export interface BlinkitLocationResult {
  lat: number;
  lng: number;
  resolvedLabel: string;
}

export async function resolveBlinkitLocation(addressQuery: string, page: Page): Promise<BlinkitLocationResult> {
  // Two-step location resolution, matching Blinkit's own frontend: autoSuggest
  // returns Google Places-style suggestions (title/subtitle + place_id, no
  // coordinates), then /location/info resolves a chosen place_id to lat/lon.
  const sessionToken = crypto.randomUUID();

  const suggestJson = await page.evaluate(
    async ({ query, sessionToken }: { query: string; sessionToken: string }) => {
      const res = await fetch(
        `/location/autoSuggest?query=${encodeURIComponent(query)}&lat=28.6139&lng=77.209&session_token=${sessionToken}`,
        { headers: { accept: "application/json" } }
      );
      if (!res.ok) throw new Error(`autoSuggest failed: ${res.status}`);
      return res.json();
    },
    { query: addressQuery, sessionToken }
  );

  const best = suggestJson?.ui_data?.suggestions?.[0];
  if (!best) throw new Error("Blinkit couldn't resolve that address.");

  const placeInfo = await page.evaluate(
    async (params: { placeId: string; title: string; description: string; sessionToken: string }) => {
      const url = `/location/info?place_id=${encodeURIComponent(params.placeId)}&title=${encodeURIComponent(
        params.title
      )}&description=${encodeURIComponent(params.description)}&is_pin_moved=false&session_token=${params.sessionToken}`;
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`location/info failed: ${res.status}`);
      return res.json();
    },
    {
      placeId: best.meta?.place_id,
      title: best.title?.text ?? "",
      description: best.subtitle?.text ?? "",
      sessionToken,
    }
  );

  const lat: number = placeInfo?.coordinate?.lat;
  const lng: number = placeInfo?.coordinate?.lon;
  if (typeof lat !== "number" || typeof lng !== "number") throw new Error("Blinkit didn't return coordinates for that address.");
  const resolvedLabel: string = placeInfo?.display_address?.address_line ?? best.title?.text ?? addressQuery;

  return { lat, lng, resolvedLabel };
}

// Pages through Blinkit's search results for one query until a page comes back
// with no new products (or the safety cap is hit), so the caller sees the full
// catalog at that location instead of just the first ~12 results.
export async function searchBlinkitAllPages(
  page: Page,
  query: string,
  lat: number,
  lng: number
): Promise<{ products: BlinkitProduct[]; complete: boolean }> {
  const seen = new Map<string, BlinkitProduct>();
  // Blinkit's search response carries its own `response.pagination.next_url` —
  // follow that directly rather than guessing offset/limit params ourselves.
  // A guessed continuation URL isn't honored reliably and just re-returns page 1.
  let nextUrl: string | null =
    `/v1/layout/search?q=${encodeURIComponent(query)}&search_type=type_to_search`;
  let complete = false;

  for (let i = 0; i < MAX_PAGES_PER_QUERY && nextUrl; i++) {
    let json: any;
    try {
      json = await page.evaluate(
        async (params: { url: string; lat: number; lng: number }) => {
          const res = await fetch(params.url, {
            method: "POST",
            headers: { "content-type": "application/json", lat: String(params.lat), lon: String(params.lng) },
            body: JSON.stringify({}),
          });
          if (!res.ok) throw new Error(`search failed: ${res.status}`);
          return res.json();
        },
        { url: nextUrl, lat, lng }
      );
    } catch {
      break; // stop paging on any error — keep whatever we already collected, NOT complete
    }

    const pageProducts = parseSearchSnippets(json);
    for (const p of pageProducts) seen.set(p.productId, p);

    nextUrl = json?.response?.pagination?.next_url ?? null;
    if (!nextUrl) complete = true; // Blinkit itself says there's no more — a trustworthy end
  }

  return { products: Array.from(seen.values()), complete };
}

export interface BlinkitPollResult {
  lat: number;
  lng: number;
  resolvedLabel: string;
  // one entry per query searched, each with the (deduped, paginated) products
  // it found. `complete` is true when pagination reached Blinkit's own
  // "no more pages" signal rather than being cut off by MAX_PAGES_PER_QUERY —
  // callers can use it to trust that a previously-seen product missing here
  // is actually out of stock, not just paginated out of reach.
  resultsByQuery: { query: string; products: BlinkitProduct[]; complete: boolean }[];
}

export async function pollBlinkit(addressQuery: string, searchQueries: string[]): Promise<BlinkitPollResult> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    await page.goto(BLINKIT_ORIGIN, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500); // let anti-bot/analytics scripts settle before firing API calls

    const { lat, lng, resolvedLabel } = await resolveBlinkitLocation(addressQuery, page);

    const resultsByQuery: { query: string; products: BlinkitProduct[]; complete: boolean }[] = [];
    for (const query of searchQueries) {
      const { products, complete } = await searchBlinkitAllPages(page, query, lat, lng);
      resultsByQuery.push({ query, products, complete });
    }

    return { lat, lng, resolvedLabel, resultsByQuery };
  } finally {
    await browser.close();
  }
}

function parseSearchSnippets(searchJson: any): BlinkitProduct[] {
  const snippets: any[] = searchJson?.response?.snippets ?? [];
  const products: BlinkitProduct[] = [];

  for (const snippet of snippets) {
    const data = snippet?.data;
    const productId = data?.identity?.id ?? data?.product_id;
    if (!productId || !data?.name?.text) continue; // skip headers/non-product widgets

    products.push({
      productId: String(productId),
      name: data.name.text,
      brand: data.brand_name?.text,
      price: parsePrice(data.normal_price?.text),
      mrp: parsePrice(data.mrp?.text),
      inventory: typeof data.inventory === "number" ? data.inventory : undefined,
      imageUrl: data.image?.url,
      inStock: data.is_sold_out !== true && data.product_state !== "out_of_stock",
      productUrl: blinkitProductUrl(String(productId), data.name.text),
    });
  }

  return products;
}

function parsePrice(text?: string): number | undefined {
  if (!text) return undefined;
  const n = Number(text.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}
