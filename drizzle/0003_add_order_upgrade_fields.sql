ALTER TABLE "orders" ADD COLUMN "discount_amount_cny" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "prior_paid_amount_cny" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "upgraded_from_plan" text;
