-- Add gen_random_uuid() defaults to all id columns
-- PostgreSQL 13+ has gen_random_uuid() built-in (no extension needed)

ALTER TABLE "customers"  ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "studios"    ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "slots"      ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "coupons"    ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "bookings"   ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "payments"   ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "notifications" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
