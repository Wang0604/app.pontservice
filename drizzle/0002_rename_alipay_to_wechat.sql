ALTER TABLE "orders" RENAME COLUMN "alipay_out_trade_no" TO "wechat_out_trade_no";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "alipay_trade_no" TO "wechat_transaction_id";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_alipay_out_trade_no_unique";--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_wechat_out_trade_no_unique" UNIQUE("wechat_out_trade_no");
