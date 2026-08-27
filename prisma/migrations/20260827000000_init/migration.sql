-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "ScalpAddress" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "addressText" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScalpAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "TrackedProduct" (
    "id" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'blinkit',
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "price" DOUBLE PRECISION,
    "mrp" DOUBLE PRECISION,
    "inventory" INTEGER,
    "imageUrl" TEXT,
    "productUrl" TEXT,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "sourceQuery" TEXT NOT NULL DEFAULT 'hot wheels',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackedProduct_addressId_lastSeenAt_idx" ON "TrackedProduct"("addressId", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrackedProduct_addressId_platform_productId_key" ON "TrackedProduct"("addressId", "platform", "productId");

-- AddForeignKey
ALTER TABLE "TrackedProduct" ADD CONSTRAINT "TrackedProduct_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "ScalpAddress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

