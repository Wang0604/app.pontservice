import QRCode from 'qrcode';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { leads, orders } from '@/lib/db/schema';
import { formatDate, formatYuan } from '@/lib/utils';
import { getPlan, getPlanShortLabel } from '@/lib/pricing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentActions } from './payment-actions';

export const dynamic = 'force-dynamic';

export default async function PaymentPage({ params }: { params: { id: string } }) {
  const [order] = await db.select().from(orders).where(eq(orders.id, params.id)).limit(1);
  if (!order) return notFound();

  const [lead] = order.leadId
    ? await db.select().from(leads).where(eq(leads.id, order.leadId)).limit(1)
    : [undefined];

  const planDef = getPlan(order.planType);
  const actualAmountCny = parseFloat(order.actualAmountCny);
  const originalAmountCny = parseFloat(order.amountCny ?? order.actualAmountCny);
  const discountAmountCny = parseFloat(order.discountAmountCny ?? '0');
  const priorPaidAmountCny = parseFloat(order.priorPaidAmountCny ?? '0');
  const isUpgrade = discountAmountCny > 0 || !!order.upgradedFromPlan;

  const qrDataUrl =
    order.paymentQrCodeUrl && order.paymentStatus !== 'paid'
      ? await QRCode.toDataURL(order.paymentQrCodeUrl, { margin: 1, width: 260 })
      : null;

  return (
    <main className="container flex min-h-screen max-w-xl items-center py-10">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">PONT AI 收款</CardTitle>
          <CardDescription>
            {isUpgrade ? '升级到 ' : ''}
            {planDef?.label ?? order.planType} · 订单 {order.orderNumber}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">客户</span>
              <span className="text-right font-medium">{lead?.companyName ?? '-'}</span>
            </div>
            <div className="mt-2 flex justify-between gap-4">
              <span className="text-muted-foreground">套餐</span>
              <span>{getPlanShortLabel(order.planType)}</span>
            </div>

            {isUpgrade ? (
              <div className="mt-3 space-y-1.5 border-t pt-3 text-sm">
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <span>套餐标准价</span>
                  <span className="font-mono">{formatYuan(originalAmountCny)}</span>
                </div>
                <div className="flex justify-between gap-4 text-emerald-700">
                  <span>启动包抵扣（已支付 ¥{priorPaidAmountCny.toLocaleString()}）</span>
                  <span className="font-mono">-{formatYuan(discountAmountCny)}</span>
                </div>
                <div className="flex justify-between gap-4 border-t pt-2 text-base font-bold">
                  <span>本次需支付</span>
                  <span className="font-mono">{formatYuan(actualAmountCny)}</span>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-muted-foreground">本次需支付</span>
                <span className="text-lg font-bold">{formatYuan(actualAmountCny)}</span>
              </div>
            )}

            {order.paymentExpiresAt && order.paymentStatus !== 'paid' && (
              <div className="mt-3 flex justify-between gap-4 text-xs text-muted-foreground">
                <span>有效期</span>
                <span>{formatDate(order.paymentExpiresAt)}</span>
              </div>
            )}
          </div>

          {!isUpgrade && (
            <p className="rounded-md bg-blue-50 p-3 text-xs leading-5 text-blue-900">
              支付的 ¥{actualAmountCny.toLocaleString()} 即「AI 落地启动包」全部费用。包含 40-60 分钟免费顾问诊断、《AI 落地路线图》PDF、50 credits
              工具体验，并作为后续升级 2999 工具包 / 9999 增长包时的全额抵扣券。
            </p>
          )}

          {order.paymentStatus === 'paid' ? (
            <div className="rounded-lg bg-emerald-50 p-5 text-center text-emerald-800">
              <div className="text-lg font-semibold">支付已确认</div>
              {order.paidAt && <div className="mt-1 text-sm">支付时间：{formatDate(order.paidAt)}</div>}
            </div>
          ) : qrDataUrl ? (
            <div className="space-y-3 text-center">
              <Image
                src={qrDataUrl}
                alt="微信支付收款二维码"
                width={260}
                height={260}
                unoptimized
                className="mx-auto rounded border p-2"
              />
              <p className="text-sm text-muted-foreground">
                请使用微信扫码支付。支付完成后本页会自动刷新状态。
              </p>
            </div>
          ) : (
            <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">
              该订单还没有生成收款二维码，请联系 PONT AI 管理员。
            </p>
          )}

          <PaymentActions
            orderId={order.id}
            initialStatus={order.paymentStatus}
            provider={order.paymentProvider}
          />
        </CardContent>
      </Card>
    </main>
  );
}
