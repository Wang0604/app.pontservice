import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, leads, contracts, paymentReceipts } from '@/lib/db/schema';
import { formatDate, formatYuan } from '@/lib/utils';
import { getPlan, getPlanShortLabel } from '@/lib/pricing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivationPanel } from './activation-panel';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetail({ params }: { params: { id: string } }) {
  const [order] = await db.select().from(orders).where(eq(orders.id, params.id));
  if (!order) return notFound();

  const [lead] = order.leadId
    ? await db.select().from(leads).where(eq(leads.id, order.leadId))
    : [undefined];
  const [contract] = order.contractId
    ? await db.select().from(contracts).where(eq(contracts.id, order.contractId))
    : [undefined];
  const receipts = await db
    .select()
    .from(paymentReceipts)
    .where(eq(paymentReceipts.orderId, order.id));

  const planDef = getPlan(order.planType);
  const actualAmountCny = parseFloat(order.actualAmountCny);
  const originalAmountCny = parseFloat(order.amountCny ?? order.actualAmountCny);
  const discountAmountCny = parseFloat(order.discountAmountCny ?? '0');
  const priorPaidAmountCny = parseFloat(order.priorPaidAmountCny ?? '0');
  const isUpgrade = priorPaidAmountCny > 0;

  return (
    <div className="container max-w-4xl py-10">
      <Link href="/admin/orders" className="text-sm text-muted-foreground hover:underline">
        ← 返回订单列表
      </Link>

      <h1 className="mt-4 text-3xl font-bold">订单 {order.orderNumber}</h1>
      <p className="text-muted-foreground">
        {getPlanShortLabel(order.planType)} ·{' '}
        {isUpgrade ? (
          <span>
            标准价 {formatYuan(originalAmountCny)} - 启动包抵扣 {formatYuan(discountAmountCny)} =
            实付 {formatYuan(actualAmountCny)}
          </span>
        ) : (
          formatYuan(actualAmountCny)
        )}
        {order.upgradedFromPlan && (
          <span className="ml-2 inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
            由 {getPlanShortLabel(order.upgradedFromPlan)} 升级
          </span>
        )}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>客户</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {lead ? (
              <>
                <div>
                  <strong>{lead.companyName}</strong>
                </div>
                <div>
                  {lead.contactName} · {lead.email}
                </div>
                {lead.phone && <div>电话: {lead.phone}</div>}
                <div className="pt-2">
                  <Link href={`/admin/leads/${lead.id}`} className="text-primary hover:underline">
                    查看申请原文 →
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">无客户信息</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>支付</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>支付方式: {order.paymentProvider ?? order.paymentMethod ?? '-'}</div>
            <div>支付状态: {order.paymentStatus}</div>
            {order.wechatOutTradeNo && <div>商户单号: {order.wechatOutTradeNo}</div>}
            {order.wechatTransactionId && <div>微信支付交易号: {order.wechatTransactionId}</div>}
            {order.paidAt && <div>启动包支付时间: {formatDate(order.paidAt)}</div>}
            <div className="pt-2">
              <Link href={`/pay/${order.id}`} target="_blank" className="text-primary hover:underline">
                打开收款页 →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 升级订单专属：抵扣明细 */}
      {isUpgrade && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>抵扣明细</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <table className="w-full">
              <tbody>
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground">套餐标准价</td>
                  <td className="py-2 text-right font-mono">¥{originalAmountCny.toLocaleString()}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground">
                    AI 落地启动包抵扣（前序已支付）
                  </td>
                  <td className="py-2 text-right font-mono text-emerald-700">
                    -¥{discountAmountCny.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-bold">本次客户补差应付</td>
                  <td className="py-2 text-right font-mono font-bold">
                    ¥{actualAmountCny.toLocaleString()}
                    {planDef?.billingCycle === 'monthly' && ' / 月'}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted-foreground">
              客户为本套餐累计支付 ¥{(priorPaidAmountCny + actualAmountCny).toLocaleString()}（含抵扣 ¥
              {priorPaidAmountCny.toLocaleString()} + 本次 ¥{actualAmountCny.toLocaleString()}）。激活时按 {planDef?.shortLabel} 发放 credits。
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>合同</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          {contract ? (
            <>
              <div>模板: {contract.templateId}</div>
              <div>状态: {contract.status}</div>
              {contract.signedAt && <div>签署于: {formatDate(contract.signedAt)}</div>}
              {contract.esignProvider && <div>签署方: {contract.esignProvider}</div>}
              <div className="pt-2">
                <Link
                  href={`/api/contracts/${contract.id}/pdf`}
                  target="_blank"
                  className="text-primary hover:underline"
                >
                  查看 PDF →
                </Link>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">未生成合同</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>打款回单 ({receipts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <p className="text-sm text-muted-foreground">客户尚未提交打款信息</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="pb-2">时间</th>
                  <th className="pb-2">金额</th>
                  <th className="pb-2">流水号</th>
                  <th className="pb-2">回单</th>
                  <th className="pb-2">状态</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2">{formatDate(r.createdAt)}</td>
                    <td className="py-2">{formatYuan(parseFloat(r.amountCny))}</td>
                    <td className="py-2 font-mono text-xs">{r.bankReference ?? '-'}</td>
                    <td className="py-2">
                      {r.fileId ? (
                        <Link
                          href={`/api/files/${r.fileId}/preview`}
                          target="_blank"
                          className="text-primary hover:underline"
                        >
                          查看
                        </Link>
                      ) : (
                        '无附件'
                      )}
                    </td>
                    <td className="py-2">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <ActivationPanel
          orderId={order.id}
          orderNumber={order.orderNumber}
          customerEmail={lead?.email ?? ''}
          customerCompany={lead?.companyName ?? ''}
          amountCny={actualAmountCny}
          originalAmountCny={originalAmountCny}
          discountAmountCny={discountAmountCny}
          currentStatus={order.paperworkStatus}
          receiptCount={receipts.length}
          planLabel={planDef?.shortLabel ?? order.planType}
        />
      </div>
    </div>
  );
}
