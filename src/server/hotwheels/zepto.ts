// Reverse-engineered from zeptonow.com's own web frontend (captured via
// DevTools network tab). No official public API exists for Zepto — these
// endpoints are undocumented and can change at any time.
//
// Unlike Blinkit, a plain Playwright session isn't enough here: Zepto sits
// behind AWS WAF Bot Control, and its client-side JS detects automation and
// simply never fires the search request at all (no error, just silence).
// playwright-extra + puppeteer-extra-plugin-stealth patches the automation
// fingerprints (navigator.webdriver, etc.) enough to get past it — confirmed
// live: without stealth, zero API calls fire; with it, real product data
// comes back normally.
import { chromium } from "playwright-extra";
// @ts-ignore - no published types for this plugin
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Page } from "playwright";

chromium.use(StealthPlugin());

const ZEPTO_ORIGIN = "https://www.zepto.com";
const IMAGE_CDN_PREFIX = "https://cdn.zeptonow.com/production/tr:w-403,pr-true,f-auto,q-60/";

export interface ZeptoProduct {
  productId: string; // productVariant.id — what the product page URL is keyed on
  name: string;
  brand?: string;
  price?: number;
  mrp?: number;
  inventory?: number;
  imageUrl?: string;
  inStock: boolean;
  productUrl: string;
}

export interface ZeptoPollResult {
  resolvedLabel: string;
  // Zepto's search returns its full result set in one response (no
  // pagination loop here), so a query's results are always "complete" —
  // a previously-seen product genuinely missing from them is a reliable
  // signal it's gone out of stock, not just paginated out of reach.
  resultsByQuery: { query: string; products: ZeptoProduct[]; complete: boolean }[];
}

// Sets the delivery location via the same UI flow a real user follows (click
// "Select Location" → type address → pick the first suggestion). Zepto's
// location-set endpoint relies on request signing done by its own client JS,
// so this drives the real UI rather than replaying the API calls directly —
// unlike Blinkit, where a plain fetch from the page context was enough.
const findLocationSpan = () => {
  const el = Array.from(document.querySelectorAll("span")).find((e) => e.textContent?.trim() === "Select Location");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
};

async function setZeptoLocation(page: Page, addressQuery: string): Promise<string> {
  await page.goto(ZEPTO_ORIGIN, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3500);

  // The page can occasionally still be mid-hydration at this point — retry
  // once after a longer wait rather than failing the whole poll outright.
  let locationSpan = await page.evaluate(findLocationSpan);
  if (!locationSpan) {
    await page.waitForTimeout(3000);
    locationSpan = await page.evaluate(findLocationSpan);
  }
  if (!locationSpan) throw new Error("Zepto: couldn't find the location picker.");
  await page.mouse.click(locationSpan.x, locationSpan.y);
  await page.waitForTimeout(1200);

  const addressInput = await page.$('input[placeholder="Search a new address"]');
  if (!addressInput) throw new Error("Zepto: address search box didn't appear.");
  await addressInput.click();
  await addressInput.type(addressQuery, { delay: 60 });

  // Wait for the autocomplete response so we know the exact suggestion text to click.
  const suggestionText = await page
    .waitForResponse((res) => res.url().includes("/maps/place/autocomplete/"), { timeout: 8000 })
    .then(async (res) => {
      const json = await res.json();
      return json?.predictions?.[0]?.description as string | undefined;
    })
    .catch(() => undefined);
  if (!suggestionText) throw new Error("Zepto couldn't resolve that address.");

  await page.waitForTimeout(500);
  const clicked = await page.evaluate((text: string) => {
    const els = Array.from(document.querySelectorAll("li, div, button"));
    const el = els.find(
      (e) => e.textContent?.includes(text.split(",")[0]) && (e as HTMLElement).offsetHeight > 0 && (e as HTMLElement).offsetHeight < 100
    );
    if (!el) return false;
    (el as HTMLElement).click();
    return true;
  }, suggestionText);
  if (!clicked) throw new Error("Zepto: couldn't click the address suggestion.");

  await page.waitForTimeout(2500);

  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.includes("Coming Soon") || bodyText.includes("coming soon")) {
    throw new Error("Zepto doesn't deliver to that address yet.");
  }

  return suggestionText;
}

export async function pollZepto(addressQuery: string, searchQueries: string[]): Promise<ZeptoPollResult> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    const resolvedLabel = await setZeptoLocation(page, addressQuery);

    const resultsByQuery: { query: string; products: ZeptoProduct[]; complete: boolean }[] = [];
    for (const query of searchQueries) {
      const products = await searchZepto(page, query);
      resultsByQuery.push({ query, products, complete: products.length > 0 });
    }

    return { resolvedLabel, resultsByQuery };
  } finally {
    await browser.close();
  }
}

async function searchZepto(page: Page, query: string): Promise<ZeptoProduct[]> {
  const products: ZeptoProduct[] = [];

  const responsePromise = page
    .waitForResponse(
      (res) => res.url().includes("user-search-service/api/v3/search") && res.request().method() === "POST" && !res.url().includes("filters"),
      { timeout: 15000 }
    )
    .catch(() => null);

  await page.goto(`${ZEPTO_ORIGIN}/search?query=${encodeURIComponent(query)}`, { waitUntil: "domcontentloaded" });
  const res = await responsePromise;
  if (!res) return products;

  let json: any;
  try {
    json = await res.json();
  } catch {
    return products;
  }

  parseWidgets(json?.layout ?? [], products);
  return products;
}

function parseWidgets(widgets: any[], out: ZeptoProduct[]) {
  for (const widget of widgets) {
    if (!widget.widgetName?.startsWith("SEARCHED_PRODUCTS")) continue;
    const items = widget.data?.resolver?.data?.items ?? [];

    for (const item of items) {
      const pr = item?.productResponse;
      const name: string | undefined = pr?.product?.name;
      const variantId: string | undefined = pr?.productVariant?.id;
      if (!name || !variantId) continue;

      const imagePath = pr?.productVariant?.images?.[0]?.path;
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "product";

      out.push({
        productId: variantId,
        name,
        brand: pr?.product?.brand,
        price: typeof pr?.sellingPrice === "number" ? pr.sellingPrice / 100 : undefined,
        mrp: typeof pr?.mrp === "number" ? pr.mrp / 100 : undefined,
        inventory: typeof pr?.availableQuantity === "number" ? pr.availableQuantity : undefined,
        imageUrl: imagePath ? `${IMAGE_CDN_PREFIX}${imagePath}` : undefined,
        inStock: pr?.outOfStock !== true,
        productUrl: `${ZEPTO_ORIGIN}/pn/${slug}/pvid/${variantId}`,
      });
    }
  }
}
