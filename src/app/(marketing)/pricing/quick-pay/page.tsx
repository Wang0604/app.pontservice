import Link from 'next/link';
import { ArrowLeft, CreditCard, Infinity as InfinityIcon, ReceiptText, ShieldCheck } from 'lucide-react';
import { getCurrentSession } from '@/lib/auth/helpers';
import { QuickPayForm } from './quick-pay-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '迅速付款链接 · PONT-AI',
  description:
    '直接付款进入工作台：999 启动包一次性付费，或 2,999 工具包按月订阅；选 12 个月（包年）自动免 Credits 限制。',
};

const reasons = [
  {
    icon: <CreditCard className="h-5 w-5" />,
    title: '微信扫码 · 当场付款',
    description:
      '提交后立刻生成订单二维码，微信扫码即可付款。付完跳到设置密码页，自动进入工作台。',
  },
  {
    icon: <InfinityIcon className="h-5 w-5" />,
    title: '12 个月起免 Credits',
    description:
      '选 12 个月（包年）→ Credits 上限自动解除（≈ 无限）。OCR / SEO / GEO 工具想用多少用多少。',
  },
  {
    icon: <ReceiptText className="h-5 w-5" />,
    title: '正规增值税发票',
    description:
      '所有付款走对公合同 + 3% 增值税普通发票，企业财务可正常报销。',
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: '随时切回 999 入口',
    description:
      '不想直接掏年费 → 改选 999 启动包先做诊断；后续升级时已付 999 全额抵扣首期。',
  },
];

export default async function QuickPayPage() {
  const session = await getCurrentSession();
  const user = session?.user;

  return (
    <>
      <section className="relative overflow-hidden bg-[#070b1c] text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,193,7,0.18),transparent_55%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,160,233,0.12),transparent_45%)]"
        />
        <div className="container relative max-w-5xl py-16 md:py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-white/65 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>

          <span className="mt-7 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200">
            Quick Pay · 迅速付款链接
          </span>
          <h1 className="mt-6 max-w-3xl text-balance text-4xl font-black leading-[1.25] md:text-6xl md:leading-[1.2]">
            999 一次性 / 2,999 × N 月
            <br className="hidden md:block" />
            选 12 个月，Credits 直接免限制。
          </h1>
          <p className="mt-7 max-w-3xl text-pretty text-lg leading-[1.85] text-white/70 md:text-xl md:leading-[1.9]">
            不走免费诊断 1v1 流程，直接挑套餐 → 选月数 → 微信扫码付款 → 进工作台用工具。
          </p>
          <p className="mt-4 max-w-3xl text-pretty text-base font-semibold leading-[1.85] text-amber-100/95 md:text-lg md:leading-[1.9]">
            重点：选「2,999 × 12」（包年）→ 自动 ≈ 10 亿 credits（话术上「免 Credits 限制」），
            OCR / SEO / GEO 想跑多少跑多少，不再被「当月 200 credits」卡住。
          </p>

          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((r) => (
              <div key={r.title} className="bg-[#070b1c]/95 p-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/15 text-amber-300">
                  {r.icon}
                </div>
                <h2 className="mt-5 text-base font-extrabold leading-[1.4]">{r.title}</h2>
                <p className="mt-3 text-sm leading-[1.85] text-white/60">{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4f6fb] py-16 text-slate-900 md:py-20">
        <div className="container max-w-3xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
              Checkout
            </p>
            <h2 className="mt-4 text-3xl font-black leading-[1.3] md:text-4xl md:leading-[1.25]">
              选套餐 → 选月数 → 微信扫码付款
            </h2>
            <p className="mt-4 text-sm leading-[1.85] text-slate-600 md:text-base md:leading-[1.9]">
              {user
                ? `已用 ${user.email} 登录，下方信息会自动预填，付款完成即直接激活当前账户。`
                : '提交后立刻生成微信扫码二维码，付款成功后在同一个页面设置登录密码，自动进入工作台。'}
            </p>

            <div className="mt-9">
              <QuickPayForm
                prefill={
                  user
                    ? {
                        email: user.email,
                        name: user.name ?? '',
                        companyName:
                          (user as unknown as { companyName?: string | null }).companyName ?? '',
                        phone:
                          (user as unknown as { phoneNumber?: string | null }).phoneNumber ?? '',
                      }
                    : undefined
                }
              />
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5 text-xs leading-[1.85] text-slate-600 md:text-sm">
            <span className="font-bold text-slate-900">为什么有「迅速付款链接」？</span>
            <br />
            原本 <Link href="/pricing/apply" className="underline hover:text-slate-900">/pricing/apply</Link> 走的是 999 启动包 → 免费诊断 → 后续升级抵扣这条 lead 链路；
            「迅速付款链接」适合：客户已经聊好了 / 老客户 / 种子客户 / 直接掏年费的——一步到位扫码付完进系统。
            两条路径的金额、合同、发票口径都一样。
          </div>
        </div>
      </section>
    </>
  );
}
