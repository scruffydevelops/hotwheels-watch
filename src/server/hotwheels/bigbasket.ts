// Reverse-engineered from bigbasket.com's own web frontend (captured via
// DevTools network tab). No official public API exists for BigBasket — these
// endpoints are undocumented and can change at any time.
//
// BigBasket's bot detection is much lighter than Zepto/Instamart's — a plain
// headless session mostly gets through — but it isn't zero: some requests
// (e.g. the autocomplete endpoint) can still 403 without stealth patches, so
// this uses the same playwright-extra + stealth setup as zepto.ts for
// reliability.
//
// IMPORTANT, confirmed live through a lot of back-and-forth: replaying
// BigBasket's location-set and search calls via page.evaluate(fetch(...)) —
// the pattern that works fine for Blinkit — returns real product data here
// too, but with WRONG stock status: everything reads as in-stock, even items
// the real site shows as "Out of Stock". Neither fixing the location call
// alone nor the search call alone was enough; both the address-selection flow
// AND the first search request have to go through actual DOM
// interaction/navigation so BigBasket's own client code can attach whatever
// client-resolved context (a hub id, most likely) a bare fetch never gets.
// Once that's happened, *paginated* fetches for later pages do inherit the
// correct session and read accurate stock.
//
// The genuinely notable thing about BigBasket: its web search API actually
// returns out-of-stock ("Notify Me") products alongside in-stock ones, which
// neither Blinkit nor Zepto's web search does — but only when reached this way.
import { chromium } from "playwright-extra";
// @ts-ignore - no published types for this plugin
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Page } from "playwright";

chromium.use(StealthPlugin());

const BB_ORIGIN = "https://www.bigbasket.com";
// Confirmed live: BigBasket's own number_of_pages for "hot wheels" was 12 —
// an 8-page cap was silently truncating the catalog every poll, so an item
// that went out of stock and got ranked onto a later page (past our cap)
// just vanished from what we saw, leaving its last-known "in stock" status
// stuck forever. 25 comfortably covers the real page counts seen so far.
const MAX_PAGES_PER_QUERY = 25;

export interface BigBasketProduct {
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

export interface BigBasketPollResult {
  resolvedLabel: string;
  // `complete` is true when pagination reached its natural end (BigBasket's
  // own number_of_pages, or a page with no new products) rather than being
  // cut off by MAX_PAGES_PER_QUERY. Callers can use this as a signal that a
  // previously-seen product genuinely missing from these results is likely
  // out of stock now, not just paginated out of reach.
  resultsByQuery: { query: string; products: BigBasketProduct[]; complete: boolean }[];
}

const ADDRESS_INPUT_SELECTOR = 'input[placeholder="Search for area or street name"]';

function clickLocationPicker(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const el = Array.from(document.querySelectorAll("span, div, button")).find(
      (e) => e.textContent?.trim() === "Select Location" && (e as HTMLElement).offsetHeight > 0 && (e as HTMLElement).offsetHeight < 60
    );
    if (!el) return false;
    (el as HTMLElement).click();
    return true;
  });
}

async function resolveBigBasketLocation(addressQuery: string, page: Page): Promise<{ resolvedLabel: string }> {
  if (!(await clickLocationPicker(page))) throw new Error("BigBasket: couldn't find the location picker.");
  await page.waitForTimeout(1200);

  // The address modal doesn't always open on the first click (timing —
  // confirmed live, this caused BigBasket polling to fail outright for one
  // saved address, leaving its stock data stale indefinitely since the poll
  // never got far enough to refresh anything). Retry once with a longer wait
  // before giving up.
  let inputCount = await page.locator(ADDRESS_INPUT_SELECTOR).count();
  if (inputCount === 0) {
    await clickLocationPicker(page);
    await page.waitForTimeout(2500);
    inputCount = await page.locator(ADDRESS_INPUT_SELECTOR).count();
  }
  if (inputCount === 0) throw new Error("BigBasket: address search box didn't appear.");

  // Two duplicate inputs exist (a hidden mobile-header copy + the real one) —
  // the real one is the wider of the two.
  const inputRects = await page.evaluate(
    (selector: string) => Array.from(document.querySelectorAll(selector)).map((i) => ({ w: (i as HTMLElement).getBoundingClientRect().width })),
    ADDRESS_INPUT_SELECTOR
  );
  let bestIdx = 0;
  for (let i = 1; i < inputRects.length; i++) if (inputRects[i].w > inputRects[bestIdx].w) bestIdx = i;

  const addrInput = page.locator(ADDRESS_INPUT_SELECTOR).nth(bestIdx);
  await addrInput.click({ force: true, timeout: 10000 });

  // Wait for the autocomplete response so we know the exact suggestion text to
  // click, rather than guessing from the raw input (which fails for long
  // addresses like "B203 Lakefield Homes Apartment, Balagere Road, Varthur,
  // Bangalore" — its first word won't appear in any suggestion's text).
  //
  // Set the whole value in one go (fill), not simulated keystrokes (type) —
  // typing a long address character-by-character fires one debounced
  // autocomplete call per pause, and listening for "the" response captured
  // whichever one fired *first*, often on a half-typed, near-empty query with
  // no useful predictions. Confirmed live: this made resolution fail outright
  // for one saved address. A single fill() triggers one clean call for the
  // complete string.
  const suggestionPromise = page
    .waitForResponse((res) => res.url().includes("/places/v1/places/autocomplete/"), { timeout: 8000 })
    .then(async (res) => {
      const json = await res.json();
      return json?.predictions?.[0]?.description as string | undefined;
    })
    .catch(() => undefined);

  await addrInput.fill(addressQuery);
  let suggestionText = await suggestionPromise;

  // Some addresses (typos, unusual formatting) don't geocode well as a whole
  // string. Fall back to just the last couple of comma-separated segments
  // (typically "<area>, <city>"), which Google's autocomplete handles far
  // more reliably than a full noisy address line.
  if (!suggestionText) {
    const segments = addressQuery.split(",").map((s) => s.trim()).filter(Boolean);
    const fallbackQuery = segments.slice(-2).join(", ");
    if (fallbackQuery && fallbackQuery !== addressQuery) {
      const fallbackPromise = page
        .waitForResponse((res) => res.url().includes("/places/v1/places/autocomplete/"), { timeout: 8000 })
        .then(async (res) => {
          const json = await res.json();
          return json?.predictions?.[0]?.description as string | undefined;
        })
        .catch(() => undefined);
      await addrInput.fill(fallbackQuery);
      suggestionText = await fallbackPromise;
    }
  }

  if (!suggestionText) throw new Error("BigBasket couldn't resolve that address.");
  await page.waitForTimeout(500);

  const matchText = suggestionText.split(",")[0]; // e.g. "Varthur" from "Varthur, Bangalore, Karnataka, India"
  const clicked = await page.evaluate((matchText: string) => {
    const els = Array.from(document.querySelectorAll("li, div, button"));
    const matches = els.filter(
      (e) =>
        e.textContent?.toLowerCase().includes(matchText.toLowerCase()) &&
        (e as HTMLElement).offsetHeight > 0 &&
        (e as HTMLElement).offsetHeight < 60 &&
        (e.textContent?.length ?? 0) < 150
    );
    matches.sort((a, b) => (a.textContent?.length ?? 0) - (b.textContent?.length ?? 0));
    const el = matches[0];
    if (!el) return false;
    (el as HTMLElement).click();
    return true;
  }, matchText);
  if (!clicked) throw new Error("BigBasket: couldn't click the address suggestion.");
  await page.waitForTimeout(3000);

  return { resolvedLabel: suggestionText };
}

export async function pollBigBasket(addressQuery: string, searchQueries: string[]): Promise<BigBasketPollResult> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    await page.goto(BB_ORIGIN, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const { resolvedLabel } = await resolveBigBasketLocation(addressQuery, page);

    const resultsByQuery: { query: string; products: BigBasketProduct[]; complete: boolean }[] = [];
    for (const query of searchQueries) {
      const { products, complete } = await searchBigBasketAllPages(page, query);
      resultsByQuery.push({ query, products, complete });
    }

    return { resolvedLabel, resultsByQuery };
  } finally {
    await browser.close();
  }
}

// Only page 1 needs real navigation (see file header) — once that request has
// gone through, subsequent paginated fetches inherit the correct session/hub
// context and read accurate stock.
async function searchBigBasketAllPages(page: Page, query: string): Promise<{ products: BigBasketProduct[]; complete: boolean }> {
  const seen = new Map<string, BigBasketProduct>();

  const firstPageResponse = page
    .waitForResponse((res) => res.url().includes("listing-svc/v2/products"), { timeout: 15000 })
    .catch(() => null);
  await page.goto(`${BB_ORIGIN}/ps/?q=${encodeURIComponent(query)}&nc=as`, { waitUntil: "domcontentloaded" });
  const firstRes = await firstPageResponse;
  let firstJson: any = null;
  if (firstRes) {
    try {
      firstJson = await firstRes.json();
    } catch {}
  }

  if (!firstJson) return { products: [], complete: false };
  addProducts(seen, firstJson);

  const numberOfPages: number | undefined = firstJson?.tabs?.[0]?.product_info?.number_of_pages;
  let complete = typeof numberOfPages === "number" && numberOfPages <= 1;

  for (let pageNum = 2; pageNum <= MAX_PAGES_PER_QUERY; pageNum++) {
    if (typeof numberOfPages === "number" && pageNum > numberOfPages) {
      complete = true;
      break;
    }

    const json = await fetchPageWithRetry(page, query, pageNum);
    if (json === "END") {
      complete = true; // a 204 is BigBasket's own end-of-results signal
      break;
    }
    if (json === null) {
      break; // network/parse error mid-pagination, or rate limit didn't clear — NOT complete
    }

    const before = seen.size;
    addProducts(seen, json);
    if (seen.size === before) {
      complete = true; // a page with nothing new is BigBasket's own end-of-results signal
      break;
    }
  }

  return { products: Array.from(seen.values()), complete };
}

// Confirmed live: BigBasket rate-limits paginated fetches after ~7 requests
// fired in quick succession (plain HTTP 429), regardless of spacing between
// them (even 1.5s/request still tripped it at request 8) — this is a burst
// cap, not a steady rate. But a ~45s cooldown reliably clears it: retrying
// after that wait succeeded immediately, and several more requests right
// after went through with no extra delay. So on a 429, wait it out and retry
// rather than giving up — without this, any query with more than ~7 pages
// (routine for "hot wheels") never reached a natural pagination end, so
// `complete` was never true and the out-of-stock downgrade never ran.
async function fetchPageWithRetry(page: Page, query: string, pageNum: number, retriesLeft = 5): Promise<any | "END" | null> {
  let status: number;
  let text: string;
  try {
    ({ status, text } = await page.evaluate(
      async ({ q, pageNum }: { q: string; pageNum: number }) => {
        const res = await fetch(`/listing-svc/v2/products?type=ps&slug=${encodeURIComponent(q)}&page=${pageNum}&bucket_id=20`, {
          headers: { accept: "application/json" },
        });
        return { status: res.status, text: await res.text() };
      },
      { q: query, pageNum }
    ));
  } catch {
    return null;
  }

  if (status === 429) {
    if (retriesLeft <= 0) return null;
    await page.waitForTimeout(45000);
    return fetchPageWithRetry(page, query, pageNum, retriesLeft - 1);
  }
  // 204 (empty success, no body) is BigBasket's real "no more results for this
  // query" signal, distinct from 429 — confirmed live, it persisted across 6
  // retries spanning ~4 minutes on the same page (a genuine rate limit clears
  // in ~45s, this didn't), meaning `number_of_pages` from page 1 can overstate
  // the real result count. Treat it as a natural end, not an error.
  if (status === 204) return "END";
  if (status < 200 || status >= 300) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function addProducts(seen: Map<string, BigBasketProduct>, json: any) {
  for (const p of parseProducts(json)) seen.set(p.productId, p);
}

function parseProducts(json: any): BigBasketProduct[] {
  const rawProducts: any[] = json?.tabs?.[0]?.product_info?.products ?? [];
  const products: BigBasketProduct[] = [];

  for (const p of rawProducts) {
    const brand: string | undefined = p?.brand?.name;
    const desc: string | undefined = p?.desc;
    if (!p?.id || !desc) continue;

    // Product descriptions often omit "Hot Wheels" (e.g. "Dirt El Segundo Rallye
    // Die-Cast Toy Car JJJ97") — the brand is a separate field. Prefix it so the
    // shared cross-platform "hot wheels" name filter still works consistently.
    const name = brand ? `${brand} ${desc}` : desc;

    products.push({
      productId: String(p.id),
      name,
      brand,
      price: parseNum(p?.pricing?.discount?.prim_price?.sp),
      mrp: parseNum(p?.pricing?.discount?.mrp),
      inventory: p?.inv_info?.skus?.[0]?.qty,
      imageUrl: p?.images?.[0]?.l ?? p?.images?.[0]?.m,
      inStock: p?.availability?.avail_status === "001" && p?.availability?.not_for_sale !== true,
      productUrl: p?.absolute_url ? `${BB_ORIGIN}${p.absolute_url}` : `${BB_ORIGIN}/pd/${p.id}/`,
    });
  }

  return products;
}

function parseNum(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
