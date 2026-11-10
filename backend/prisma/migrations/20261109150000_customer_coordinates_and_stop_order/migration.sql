-- AlterTable
ALTER TABLE "customers" ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "visits" ADD COLUMN "stop_order" INTEGER;

