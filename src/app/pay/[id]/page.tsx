import QRCode from 'qrcode';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';
import { leads, orders } from '@/lib/db/schema';
import { formatDate, formatYuan } from '@/lib/utils';
import { getPlan, getPlanShortLabel } from '@/lib/pricing';
import { getCurrentSession } from '@/lib/auth/helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentActions } from './payment-actions';
import { AccountSetupForm } from './account-setup-form';

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

  const session = await getCurrentSession();
  const sessionUser = session?.user ?? null;
  const isPaid = order.paymentStatus === 'paid';
  const isActivated = order.paperworkStatus === 'activated';
  const orderBoundToCurrentUser =
    !!sessionUser && !!order.userId && sessionUser.id === order.userId;
  const sessionEmailMatches =
    !!sessionUser && !!lead?.email && sessionUser.email.toLowerCase() === lead.email.toLowerCase();
  // 已登录但订单还没绑过 user_id（比如客户先付款再登录的情况）
  const canFastActivate =
    !!sessionUser && (orderBoundToCurrentUser || (!order.userId && sessionEmailMatches));

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

          {!isUpgrade && !isPaid && (
            <p className="rounded-md bg-blue-50 p-3 text-xs leading-5 text-blue-900">
              支付的 ¥{actualAmountCny.toLocaleString()} 即「AI 落地启动包」全部费用。包含 40-60 分钟免费顾问诊断、《AI 落地路线图》PDF、50 credits
              工具体验，并作为后续升级 2999 工具包 / 9999 增长包时的全额抵扣券。
            </p>
          )}

          {/* === 状态分发 === */}
          {isActivated ? (
            <ActivatedPanel orderId={order.id} hasInvoicePdf={!!order.invoiceR2Key} />
          ) : isPaid && lead ? (
            <AccountSetupForm
              orderId={order.id}
              prefilledEmail={lead.email}
              prefilledFullName={lead.contactName ?? ''}
              isLoggedIn={canFastActivate}
            />
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
                请使用微信扫码支付。支付完成后本页会自动刷新，并在同一页面引导您设置登录密码。
              </p>
            </div>
          ) : (
            <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">
              该订单还没有生成收款二维码，请联系 PONT AI 管理员或返回{' '}
              <Link href="/pricing/apply" className="underline">
                定价页
              </Link>{' '}
              重新提交。
            </p>
          )}

          {/* 仅在还未支付时显示「轮询 / 模拟已支付」按钮 */}
          {!isPaid && (
            <PaymentActions
              orderId={order.id}
              initialStatus={order.paymentStatus}
              provider={order.paymentProvider}
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function ActivatedPanel({
  orderId,
  hasInvoicePdf,
}: {
  orderId: string;
  hasInvoicePdf: boolean;
}) {
  return (
    <div className="space-y-4 rounded-lg bg-emerald-50 p-5 text-emerald-900">
      <div>
        <div className="text-lg font-semibold">账户已激活</div>
        <div className="mt-1 text-sm text-emerald-800">
          50 credits 已到账。顾问会在 1 个工作日内主动联系您预约 40-60 分钟 1v1 诊断会议。
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/account">
            前往工作台
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/orders/${orderId}`}>查看订单详情</Link>
        </Button>
        {hasInvoicePdf && (
          <Button asChild variant="outline">
            <Link href={`/api/orders/${orderId}/invoice`}>下载发票</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
