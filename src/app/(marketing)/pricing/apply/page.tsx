import Link from 'next/link';
import { ArrowLeft, FileText, Gift, ReceiptText, ShieldCheck } from 'lucide-react';
import { getCurrentSession } from '@/lib/auth/helpers';
import { ApplyForm } from './apply-form';

export const dynamic = 'force-dynamic';

const reasons = [
  {
    icon: <FileText className="h-5 w-5" />,
    title: '40-60 分钟拆透业务',
    description:
      '把发票、合同、客服、获客、内容、流程逐项盘点，定位真正能用 AI 解决的具体场景。会议本身在话术与定价上都是免费的。',
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
      '不是聊一聊；交付的是《企业 AI 落地路线图》PDF，包含问题清单、优先级、推荐工具与上线节奏，可作为采购依据。',
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: '专注中小企业',
    description:
      '大企业从数字化到 AI 普遍要 18-36 个月。我们专注扶持中小企业，无论是否已有数字化基础，都能从启动包开始打通 AI 落地。',
  },
];

const evidences = [
  '40-60 分钟 1v1 远程会议',
  '《AI 落地路线图》PDF',
  '会后 7 天微信答疑',
  '50 credits 工具体验',
  '999 元 AI 工具抵扣券',
  '电子合同 + 正规普票',
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
            申请 · 999 启动包是必经入口
          </span>
          <h1 className="mt-6 max-w-3xl text-balance text-4xl font-black leading-[1.06] tracking-[-0.045em] md:text-6xl">
            支付 999，开启企业 AI 落地的第一步
          </h1>
          <p className="mt-6 max-w-3xl text-pretty text-lg leading-8 text-white/70">
            40-60 分钟资深顾问 1v1 诊断 + 《AI 落地路线图》PDF + 50 credits 工具体验，全部免费交付。
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
              Application
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] md:text-4xl">
              填一张 AI 落地启动包申请，1 个工作日内回复
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {user
                ? `已用 ${user.email} 登录，下方信息会自动预填。`
                : '未登录也能提交，我们会通过邮件联系您；审批通过后自动创建账号。'}
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
            提交后我们会用邮件、电话联系您；流程透明：审批 → 电子合同 → 999 对公打款 → 安排顾问诊断 → 出报告 → 30 天内可抵扣升级。
          </p>
        </div>
      </section>
    </>
  );
}
