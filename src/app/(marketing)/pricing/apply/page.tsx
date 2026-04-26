import Link from 'next/link';
import { ArrowLeft, CreditCard, Gift, ReceiptText, ShieldCheck } from 'lucide-react';
import { getCurrentSession } from '@/lib/auth/helpers';
import { ApplyForm } from './apply-form';

export const dynamic = 'force-dynamic';

const reasons = [
  {
    icon: <CreditCard className="h-5 w-5" />,
    title: '在线微信扫码支付',
    description:
      '提交后立刻生成订单二维码，微信扫码即可付款。付完当场设置邮箱密码，自动进入工作台，不需要等任何审批。',
  },
  {
    icon: <Gift className="h-5 w-5" />,
    title: '999 = AI 工具抵扣券',
    description:
      '所付的 999 元等同于一张 AI 工具抵扣券：30 天内升级 2999 工具包或 9999 增长包，全额抵扣首期，结果上等于免费拿到完整诊断。',
  },
  {
    icon: <ReceiptText className="h-5 w-5" />,
    title: '一份可执行 PDF 报告',
    description:
      '激活后顾问会主动联系约 40-60 分钟 1v1 诊断，并交付《AI 落地路线图》PDF（问题清单、优先级、推荐工具与上线节奏）。',
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: '专注中小企业',
    description:
      '大企业从数字化到 AI 普遍要 18-36 个月。我们专注扶持中小企业，无论是否已有数字化基础，都能从启动包开始打通 AI 落地。',
  },
];

const evidences = [
  '微信扫码 3 分钟付款',
  '50 credits 立即到账',
  '40-60 分钟 1v1 远程诊断',
  '《AI 落地路线图》PDF',
  '999 元 AI 工具抵扣券',
  '正规增值税普通发票',
];

export default async function ApplyPage() {
  const session = await getCurrentSession();
  const user = session?.user;

  return (
    <>
      <section className="relative overflow-hidden bg-[#070b1c] text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,160,233,0.18),transparent_55%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.05),transparent_45%)]"
        />
        <div className="container relative max-w-5xl py-16 md:py-20">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm font-bold text-white/65 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            返回完整服务结构
          </Link>

          <span className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white/85">
            微信扫码 · 3 分钟开通
          </span>
          <h1 className="mt-6 max-w-3xl text-balance text-4xl font-black leading-[1.06] tracking-[-0.045em] md:text-6xl">
            提交 → 微信支付 999 → 设置密码 → 进入工作台
          </h1>
          <p className="mt-6 max-w-3xl text-pretty text-lg leading-8 text-white/70">
            填一张简短表单，立刻生成订单二维码，微信扫码完成支付，当场设置登录密码——账号即开即用，不需要等任何人工审批。
            <br />
            <span className="mt-2 inline-block font-semibold text-white/90">
              所付 999 元在话术上是 AI 工具抵扣券——升级 2999 工具包时全额抵扣，等于一分钱没花就把完整诊断拿到手。
            </span>
          </p>

          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((r) => (
              <div key={r.title} className="bg-[#070b1c]/95 p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00a0e9]/15 text-[#00a0e9]">
                  {r.icon}
                </div>
                <h2 className="mt-4 text-base font-extrabold tracking-tight">{r.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/55">{r.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            {evidences.map((e) => (
              <span
                key={e}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/75"
              >
                {e}
              </span>
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
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] md:text-4xl">
              先付款，再开通账户 · 全程不超过 3 分钟
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {user
                ? `已用 ${user.email} 登录，下方信息会自动预填，付款完成即直接激活当前账户。`
                : '提交后立刻生成微信扫码二维码，付款成功后在同一个页面设置登录密码，自动进入工作台。'}
            </p>

            <div className="mt-8">
              <ApplyForm
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

          <p className="mt-6 text-center text-xs text-slate-500">
            正确流程：填表 → 微信扫码付款 ¥999 → 设置邮箱密码 → 50 credits 立即到账 → 顾问主动联系约 1v1 诊断 → 交付路线图 PDF → 30 天内可抵扣升级。
          </p>
        </div>
      </section>
    </>
  );
}
