const CITIES = [
  "Delhi NCR", "Mumbai", "Bangalore", "Pune", "Hyderabad", "Chennai",
  "Kolkata", "Ahmedabad", "Chandigarh", "Jaipur", "Lucknow", "Indore",
  "Surat", "Nagpur", "Kochi", "Bhopal", "Coimbatore", "Vadodara",
];

const GENERIC_QUERY = "hot wheels";

const el = {
  citySelect: document.getElementById("city-select"),
  addressForm: document.getElementById("address-form"),
  addressFormError: document.getElementById("address-form-error"),
  wishlistForm: document.getElementById("wishlist-form"),
  wishlistList: document.getElementById("wishlist-list"),
  addresses: document.getElementById("addresses"),
  checkAllBtn: document.getElementById("check-all-btn"),
  lastChecked: document.getElementById("last-checked"),
  wishlistMatches: document.getElementById("wishlist-matches"),
  toast: document.getElementById("toast"),
  themeToggleBtn: document.getElementById("theme-toggle-btn"),
  ntfyLink: document.getElementById("ntfy-link"),
  notifyTestBtn: document.getElementById("notify-test-btn"),
  authScreen: document.getElementById("auth-screen"),
  appRoot: document.getElementById("app"),
  authFormError: document.getElementById("auth-form-error"),
  logoutBtn: document.getElementById("logout-btn"),
};

function init() {
  for (const city of CITIES) {
    const opt = document.createElement("option");
    opt.value = city;
    opt.textContent = city;
    el.citySelect.appendChild(opt);
  }

  el.addressForm.addEventListener("submit", onAddAddress);
  el.wishlistForm.addEventListener("submit", onAddWishlistItem);
  el.checkAllBtn.addEventListener("click", onCheckAll);
  el.themeToggleBtn.addEventListener("click", toggleTheme);
  el.notifyTestBtn.addEventListener("click", onSendTestNotification);
  updateThemeToggleIcon();

  el.logoutBtn.addEventListener("click", onLogout);

  showAuthErrorFromUrl();
  checkAuth();
}

// Google sign-in failures land back on "/" with ?auth_error=... (set by the
// server's OAuth callback) rather than an in-page fetch response, since the
// whole flow is a full-page redirect through Google, not an XHR.
function showAuthErrorFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const err = params.get("auth_error");
  if (!err) return;
  el.authFormError.textContent = err;
  el.authFormError.hidden = false;
  window.history.replaceState({}, "", window.location.pathname);
}

async function checkAuth() {
  const res = await fetch("/api/auth/me");
  const data = await res.json();
  if (data.loggedIn) {
    showApp();
  } else {
    showAuthScreen();
  }
}

let lastCheckedTickerStarted = false;

function showApp() {
  el.authScreen.hidden = true;
  el.appRoot.hidden = false;
  loadState();
  if (!lastCheckedTickerStarted) {
    lastCheckedTickerStarted = true;
    setInterval(updateLastCheckedText, 15000);
  }
}

function showAuthScreen() {
  el.appRoot.hidden = true;
  el.authScreen.hidden = false;
}

async function onLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  showAuthScreen();
}

async function loadState() {
  const res = await fetch("/api/state");
  if (res.status === 401) {
    showAuthScreen();
    return;
  }
  const state = await res.json();
  render(state);
}

let lastCheckedAt = null;

function render(state) {
  renderWishlist(state.wishlist);
  renderWishlistMatches(state.addresses, state.wishlist);
  renderAddresses(state.addresses, state.wishlist);
  const ntfyUrl = `https://ntfy.sh/${state.ntfyTopic}`;
  el.ntfyLink.href = ntfyUrl;
  el.ntfyLink.textContent = ntfyUrl;
  lastCheckedAt = state.lastCheckedAt;
  updateLastCheckedText();
}

function updateLastCheckedText() {
  if (!lastCheckedAt) {
    el.lastChecked.hidden = true;
    return;
  }
  el.lastChecked.hidden = false;
  el.lastChecked.textContent = `Last checked ${relativeTime(new Date(lastCheckedAt))}`;
}

function relativeTime(date) {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

async function onSendTestNotification() {
  el.notifyTestBtn.disabled = true;
  const original = el.notifyTestBtn.textContent;
  el.notifyTestBtn.textContent = "Sending…";
  try {
    const res = await fetch("/api/notify-test", { method: "POST" });
    const json = await res.json();
    showToast(json.ok ? "Test notification sent!" : json.error || "Failed to send.");
  } finally {
    el.notifyTestBtn.disabled = false;
    el.notifyTestBtn.textContent = original;
  }
}

function renderWishlist(wishlist) {
  el.wishlistList.innerHTML = "";
  if (wishlist.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-hint";
    li.textContent = "No wishlist items yet.";
    el.wishlistList.appendChild(li);
    return;
  }
  for (const item of wishlist) {
    const li = document.createElement("li");
    li.className = "chip";
    li.innerHTML = `⭐ ${escapeHtml(item.name)} <button title="Remove" data-id="${item.id}">✕</button>`;
    li.querySelector("button").addEventListener("click", () => removeWishlistItem(item.id));
    el.wishlistList.appendChild(li);
  }
}

function renderWishlistMatches(addresses, wishlist) {
  el.wishlistMatches.innerHTML = "";
  const wishlistNames = new Set(wishlist.map((w) => w.name));
  const isWishlistMatch = (p) => wishlistNames.has(p.sourceQuery) && p.sourceQuery !== GENERIC_QUERY;

  // Address doesn't matter for *which* products show up here — the same
  // product from two different addresses is the same product to the person
  // watching for it. Dedupe by platform + name (rather than productId, which
  // differs per hub), but still track every address it's tracked at so the
  // card can show where it's actually available.
  const byKey = new Map();
  for (const addr of addresses) {
    for (const p of addr.products) {
      if (!isWishlistMatch(p)) continue;
      const key = `${p.platform}|${p.name.toLowerCase()}`;
      let entry = byKey.get(key);
      if (!entry) {
        entry = { product: p, atAddresses: [] };
        byKey.set(key, entry);
      } else if (p.inStock && !entry.product.inStock) {
        entry.product = p; // prefer the in-stock copy as the representative card
      }
      entry.atAddresses.push({ label: addr.label, inStock: p.inStock });
    }
  }

  const matches = Array.from(byKey.values()).sort((a, b) => (b.product.inStock ? 1 : 0) - (a.product.inStock ? 1 : 0));

  if (matches.length === 0) {
    el.wishlistMatches.appendChild(emptyHint("No wishlist matches yet."));
    return;
  }

  const grid = document.createElement("div");
  grid.className = "product-grid wishlist-match-grid";
  for (const { product, atAddresses } of matches) {
    const card = renderProductCard(product, wishlistNames);
    const addrRow = document.createElement("div");
    addrRow.className = "match-addresses";
    for (const { label, inStock } of atAddresses) {
      const chip = document.createElement("span");
      chip.className = "match-address-chip" + (inStock ? " in-stock" : "");
      chip.textContent = label;
      addrRow.appendChild(chip);
    }
    card.querySelector(".product-info").appendChild(addrRow);
    grid.appendChild(card);
  }
  el.wishlistMatches.appendChild(grid);
}

function renderAddresses(addresses, wishlist) {
  el.addresses.innerHTML = "";
  const wishlistNames = new Set(wishlist.map((w) => w.name));

  if (addresses.length === 0) {
    const p = document.createElement("p");
    p.className = "empty-hint";
    p.textContent = "No addresses yet — add one above to start watching for Hot Wheels stock nearby.";
    el.addresses.appendChild(p);
    return;
  }

  for (const addr of addresses) {
    const card = document.createElement("section");
    card.className = "card address-card";

    const header = document.createElement("div");
    header.className = "address-header";
    header.innerHTML = `
      <div>
        <div class="address-title">${escapeHtml(addr.label)}</div>
        <div class="address-sub">${escapeHtml(addr.addressText)}, ${escapeHtml(addr.city)}</div>
      </div>
      <div class="address-actions">
        <span class="check-msg" data-role="check-msg"></span>
        <button class="btn btn-outline btn-sm" data-role="check-now">Check now</button>
        <button class="btn btn-ghost" data-role="remove" title="Remove address">🗑</button>
      </div>
    `;
    header.querySelector('[data-role="check-now"]').addEventListener("click", (e) => onCheckAddress(addr.id, e.target, header));
    header.querySelector('[data-role="remove"]').addEventListener("click", () => onRemoveAddress(addr.id));
    card.appendChild(header);

    if (addr.products.length === 0) {
      const p = document.createElement("p");
      p.className = "empty-hint";
      p.textContent = 'No results yet — hit "Check now" to run the first scan.';
      card.appendChild(p);
    } else {
      const isWishlistMatch = (p) => wishlistNames.has(p.sourceQuery) && p.sourceQuery !== GENERIC_QUERY;
      // Wishlist matches are shown in the sidebar (see renderWishlistMatches)
      // instead of inline here — they're the specific items being watched
      // for, so they get a dedicated, always-visible spot rather than
      // pushing the general stock lists down the page.
      const rest = addr.products.filter((p) => !isWishlistMatch(p));
      const inStock = rest.filter((p) => p.inStock);
      const outStock = rest.filter((p) => !p.inStock);

      // Blinkit and Zepto's web search only return available products — but
      // BigBasket's does return out-of-stock ("Notify Me") items too. This
      // section only renders when there's actually something in it, so
      // addresses without any BigBasket coverage don't show a bare "(0)".
      card.appendChild(renderProductSection(`In stock (${inStock.length})`, inStock, wishlistNames, false));
      if (outStock.length > 0) {
        card.appendChild(renderProductSection(`Out of stock (${outStock.length})`, outStock, wishlistNames, true));
      }
    }

    el.addresses.appendChild(card);
  }
}

function renderProductSection(title, products, wishlistNames, collapsible, extraTitleClass) {
  let body;
  if (products.length === 0) {
    body = emptyHint("None right now.");
  } else {
    body = document.createElement("div");
    body.className = "product-grid";
    for (const p of products) {
      body.appendChild(renderProductCard(p, wishlistNames));
    }
  }

  const titleClass = "product-section-title" + (extraTitleClass ? " " + extraTitleClass : "");

  if (collapsible) {
    const details = document.createElement("details");
    details.className = "product-section";
    const summary = document.createElement("summary");
    summary.className = titleClass;
    summary.textContent = title;
    details.appendChild(summary);
    details.appendChild(body);
    return details;
  }

  const section = document.createElement("div");
  section.className = "product-section";
  const heading = document.createElement("h3");
  heading.className = titleClass;
  heading.textContent = title;
  section.appendChild(heading);
  section.appendChild(body);
  return section;
}

function emptyHint(text) {
  const p = document.createElement("p");
  p.className = "empty-hint";
  p.textContent = text;
  return p;
}

function renderProductCard(p, wishlistNames) {
  const isWishlistMatch = wishlistNames.has(p.sourceQuery) && p.sourceQuery !== GENERIC_QUERY;

  const wrap = document.createElement(p.productUrl ? "a" : "div");
  wrap.className = "product-card" + (isWishlistMatch ? " wishlist-match" : "");
  if (p.productUrl) {
    wrap.href = p.productUrl;
    wrap.target = "_blank";
    wrap.rel = "noopener";
  }

  const imgWrap = document.createElement("div");
  imgWrap.className = "product-img-wrap";
  if (isWishlistMatch) {
    const star = document.createElement("span");
    star.className = "wishlist-star";
    star.title = `Matches wishlist: ${p.sourceQuery}`;
    star.textContent = "⭐";
    imgWrap.appendChild(star);
  }
  if (p.imageUrl) {
    const img = document.createElement("img");
    img.src = p.imageUrl;
    img.alt = p.name;
    imgWrap.appendChild(img);
  } else {
    const fallback = document.createElement("span");
    fallback.className = "product-img-fallback";
    fallback.textContent = "🚗";
    imgWrap.appendChild(fallback);
  }
  const badge = document.createElement("span");
  badge.className = "badge " + (p.inStock ? "in-stock" : "out-stock");
  badge.textContent = p.inStock ? "In stock" : "Out of stock";
  imgWrap.appendChild(badge);

  if (p.platform) {
    const platformNames = { blinkit: "Blinkit", zepto: "Zepto", bigbasket: "BigBasket" };
    const platformBadge = document.createElement("span");
    platformBadge.className = "platform-badge platform-" + p.platform;
    platformBadge.textContent = platformNames[p.platform] ?? p.platform;
    imgWrap.appendChild(platformBadge);
  }

  wrap.appendChild(imgWrap);

  const info = document.createElement("div");
  info.className = "product-info";
  const name = document.createElement("div");
  name.className = "product-name";
  name.textContent = p.name;
  info.appendChild(name);
  if (p.price != null) {
    const price = document.createElement("div");
    price.className = "product-price";
    price.textContent = `₹${p.price}`;
    if (p.mrp && p.mrp > p.price) {
      const mrp = document.createElement("span");
      mrp.className = "product-mrp";
      mrp.textContent = `₹${p.mrp}`;
      price.appendChild(mrp);
    }
    info.appendChild(price);
  }
  wrap.appendChild(info);

  return wrap;
}

async function onAddAddress(e) {
  e.preventDefault();
  el.addressFormError.hidden = true;
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const data = {
    label: form.label.value,
    city: form.city.value,
    addressText: form.addressText.value,
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Adding… (checking Blinkit, Zepto & BigBasket, ~45s)";
  try {
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.ok) {
      el.addressFormError.textContent = json.error || "Couldn't add that address.";
      el.addressFormError.hidden = false;
      return;
    }
    form.reset();
    el.citySelect.selectedIndex = 0;
    await loadState();
    showToast(`Added "${data.label}"`);
  } catch {
    el.addressFormError.textContent = "Network error — try again.";
    el.addressFormError.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Add address";
  }
}

async function onCheckAddress(addressId, button, headerEl) {
  const msgEl = headerEl.querySelector('[data-role="check-msg"]');
  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Checking…";
  try {
    const res = await fetch(`/api/addresses/${addressId}/check`, { method: "POST" });
    const json = await res.json();
    if (!json.ok) {
      msgEl.textContent = json.error || "Check failed.";
    } else {
      const parts = [];
      if (json.newCount) parts.push(`${json.newCount} new`);
      if (json.restockedCount) parts.push(`${json.restockedCount} back in stock`);
      msgEl.textContent = parts.length ? parts.join(", ") : "No changes.";
      await loadState();
    }
  } catch {
    msgEl.textContent = "Network error.";
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

async function onRemoveAddress(addressId) {
  await fetch(`/api/addresses/${addressId}`, { method: "DELETE" });
  await loadState();
}

async function onAddWishlistItem(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.name.value.trim();
  if (!name) return;
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  try {
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (json.ok) {
      form.reset();
      await loadState();
      showToast(`"${name}" will be searched at every address from now on`);
    }
  } finally {
    submitBtn.disabled = false;
  }
}

async function removeWishlistItem(id) {
  await fetch(`/api/wishlist/${id}`, { method: "DELETE" });
  await loadState();
}

async function onCheckAll() {
  el.checkAllBtn.disabled = true;
  const originalText = el.checkAllBtn.textContent;
  el.checkAllBtn.textContent = "Checking all…";
  try {
    const res = await fetch("/api/check-all", { method: "POST" });
    const json = await res.json();
    await loadState();
    if (json.ok) {
      const total = Object.values(json.results).reduce((sum, r) => sum + (r.newCount || 0), 0);
      showToast(total > 0 ? `${total} new item(s) found across all addresses` : "Checked all — no new items.");
    }
  } finally {
    el.checkAllBtn.disabled = false;
    el.checkAllBtn.textContent = originalText;
  }
}

let toastTimer;
function showToast(text) {
  clearTimeout(toastTimer);
  el.toast.textContent = text;
  el.toast.hidden = false;
  toastTimer = setTimeout(() => (el.toast.hidden = true), 4000);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function getEffectiveTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function toggleTheme() {
  const next = getEffectiveTheme() === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  document.documentElement.setAttribute("data-theme", next);
  updateThemeToggleIcon();
}

function updateThemeToggleIcon() {
  el.themeToggleBtn.textContent = getEffectiveTheme() === "dark" ? "☀️" : "🌙";
}

init();
