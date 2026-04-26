ALTER TABLE "orders" ADD COLUMN "payment_provider" text DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_status" text DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_qr_code_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "alipay_out_trade_no" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "alipay_trade_no" text;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_alipay_out_trade_no_unique" UNIQUE("alipay_out_trade_no");