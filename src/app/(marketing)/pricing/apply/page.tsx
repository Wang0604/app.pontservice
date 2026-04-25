import Link from 'next/link';
import { ArrowLeft, FileText, ReceiptText, ShieldCheck, Wallet } from 'lucide-react';
import { getCurrentSession } from '@/lib/auth/helpers';
import { PLANS } from '@/lib/pricing';
import { ApplyForm } from './apply-form';

export const dynamic = 'force-dynamic';

const reasons = [
  {
    icon: <FileText className="h-5 w-5" />,
    title: '40-60 分钟拆透业务',
    description:
      '把发票、合同、流程、获客这些环节挨个拆开，定位真正能用 AI 解决的具体场景，而不是被供应商话术带着走。',
  },
  {
    icon: <Wallet className="h-5 w-5" />,
    title: '999 全额抵扣升级',
    description:
      '诊断后 30 天内升级 2999 工具包或 9999 增长陪跑，已支付的 999 元自动抵扣首期，避免重复付费。',
  },
  {
    icon: <ReceiptText className="h-5 w-5" />,
    title: '出一份可执行 PDF 报告',
    description:
      '不只是聊一聊；会出一份能发给团队、能作为采购依据的诊断报告，包含问题、优先级、推荐路径。',
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: '避免直接买错',
    description:
      '直接买工具最大的风险是上线没人用、退款条款不利。先做诊断把"值不值得做"定下来，避免决策反悔。',
  },
];

const evidences = [
  '60 分钟 1v1 远程会议',
  '可执行 PDF 诊断报告',
  '会后 7 天微信答疑',
  '50 credits 体验工具',
  '电子合同 + 正规普票',
  '对公账户、可财务报销',
];

export default async function ApplyPage({ searchParams }: { searchParams: { plan?: string } }) {
  const session = await getCurrentSession();
  const user = session?.user;
  const defaultPlan = PLANS.find((p) => p.id === searchParams.plan)?.id ?? '999';

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
            返回三档套餐
          </Link>

          <span className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white/85">
            申请 · 999 诊断为入口
          </span>
          <h1 className="mt-6 max-w-3xl text-balance text-4xl font-black leading-[1.06] tracking-[-0.045em] md:text-6xl">
            先用 999 诊断，把企业的弊病摊到桌面上
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-white/70">
            诊断会议 40-60 分钟，由顾问把发票、合同、流程、获客等环节挨个拆开，定位真正值得用 AI
            解决的具体问题。诊断后续如果继续买工具包或陪跑，999 元自动抵扣首期。
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
              Application
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] md:text-4xl">
              填一张诊断申请，1 个工作日内回复
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {user
                ? `已用 ${user.email} 登录，下方信息会自动预填。`
                : '未登录也能提交，我们会通过邮件联系您；审批通过后自动创建账号。'}
            </p>

            <div className="mt-8">
              <ApplyForm
                defaultPlan={defaultPlan}
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
            提交后我们会用邮件、电话联系您；流程透明：审批 → 电子合同 → 对公打款 → 顾问预约 →
            出报告。
          </p>
        </div>
      </section>
    </>
  );
}
