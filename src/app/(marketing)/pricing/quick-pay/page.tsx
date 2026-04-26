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
    title: '当场扫码 · 当场启用',
    description:
      '提交订单后立即生成微信支付二维码；付款成功即可设置登录密码、进入工作台开始使用。',
  },
  {
    icon: <InfinityIcon className="h-5 w-5" />,
    title: '包年订阅 · Credits 不设上限',
    description:
      '选择 12 个月订阅后，Credits 用量在订阅期内不设上限，团队可按需使用所有 AI 工具。',
  },
  {
    icon: <ReceiptText className="h-5 w-5" />,
    title: '对公合同 + 增值税发票',
    description:
      '所有付款均提供对公合同与 3% 增值税普通发票，企业财务可正常入账与报销。',
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: '可切换 999 启动包路径',
    description:
      '想先做一次免费 1v1 诊断再决定订阅周期？也可改选 999 启动包，后续升级时金额全额抵扣首期。',
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
        <div className="container relative max-w-5xl py-16 md:py-24">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-white/65 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Link>
          </div>

          <div className="mt-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200">
              Quick Pay · 迅速付款链接
            </span>
          </div>
          <h1 className="mt-7 max-w-3xl text-balance text-4xl font-black leading-[1.4] md:text-6xl md:leading-[1.3]">
            灵活选择付款周期，
            <br className="hidden md:block" />
            立即解锁 AI 工作台。
          </h1>
          <p className="mt-8 max-w-3xl text-pretty text-lg leading-[1.95] text-white/75 md:text-xl md:leading-[2]">
            跳过免费诊断流程，直接挑选合适的套餐与订阅周期，扫码付款后立即开通账户、进入工作台开始使用。
          </p>
          <p className="mt-5 max-w-3xl text-pretty text-base font-semibold leading-[1.95] text-amber-100/95 md:text-lg md:leading-[2]">
            选择 12 个月（包年）订阅，可在订阅期内不设 Credits 用量上限——团队可按需使用 OCR、SEO、GEO 等 AI 工具。
          </p>

          <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
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
            <h2 className="mt-5 text-3xl font-black leading-[1.4] md:text-4xl md:leading-[1.35]">
              三步完成付款
            </h2>
            <p className="mt-5 text-sm leading-[1.95] text-slate-600 md:text-base md:leading-[2]">
              {user
                ? `已用 ${user.email} 登录，下方信息会自动预填，付款完成即直接激活当前账户。`
                : '选择适合的套餐与订阅周期，扫码付款成功后即可设置登录密码，自动进入工作台开始使用。'}
            </p>

            <div className="mt-10">
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

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white/80 p-6 text-xs leading-[1.95] text-slate-600 md:text-sm md:leading-[2]">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
              另一条路径
            </p>
            <p className="mt-3 text-sm font-bold text-slate-900 md:text-base">
              想先做免费 1v1 诊断？前往 999 启动包预约页。
            </p>
            <p className="mt-3">
              999 启动包包含一次 40-60 分钟资深顾问 1v1 诊断、《AI 落地路线图》PDF
              报告与 50 credits 工具体验；后续升级到 2,999 工具包或 9,999 增长包时，999 元全额抵扣首期。
              两条路径在合同与发票口径上完全一致。
            </p>
            <Link
              href="/pricing/apply"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 underline-offset-4 hover:underline"
            >
              前往预约 999 启动包 →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
