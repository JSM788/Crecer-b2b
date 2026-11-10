ALTER TABLE "users" ADD COLUMN "phone" VARCHAR(16);
ALTER TABLE "users" ADD CONSTRAINT "users_phone_format" CHECK ("phone" IS NULL OR "phone" ~ '^\+[1-9][0-9]{7,14}$');
