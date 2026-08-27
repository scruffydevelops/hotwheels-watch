# Playwright drives real headless Chromium for the Blinkit/Zepto/BigBasket
# polls — Railway's default Nixpacks builder doesn't install the system
# libraries Chromium needs, so this uses Microsoft's Playwright image, which
# bundles them. Tag must match the "playwright" version in package.json.
FROM mcr.microsoft.com/playwright:v1.62.1-jammy

WORKDIR /app

COPY package.json package-lock.json ./
# The postinstall hook (`prisma generate`) runs during `npm ci`, so the
# schema needs to already be in place before that step — otherwise it fails
# looking for prisma/schema.prisma, which hasn't been copied in yet.
COPY prisma ./prisma
RUN npm ci

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# Applies any pending migrations (safe/idempotent — never resets data) before
# starting, so a fresh production database gets its schema on first deploy
# without a manual step.
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
