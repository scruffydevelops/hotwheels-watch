-- Blinkit (the only source of lat/lng) is disabled in production, so these
-- columns can no longer be assumed to have a value.
ALTER TABLE "ScalpAddress" ALTER COLUMN "lat" DROP NOT NULL;
ALTER TABLE "ScalpAddress" ALTER COLUMN "lng" DROP NOT NULL;
