import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { DIAGNOSIS_DEPOSIT_CNY, PLANS, calcUpgradeAmount } from '@/lib/pricing';
import { formatYuan } from '@/lib/utils';

export const metadata = {
  title: '定价 · AI 落地启动包',
  description:
    'PONT-AI 中小企业 AI 落地：999 启动包是必经入口（含免费诊断咨询），后续升级 2999 工具包 / 9999 增长包时 999 全额抵扣。',
};

export default function PricingPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-[#070b1c] text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,160,233,0.18),transparent_55%)]"
        />
        <div className="container relative max-w-5xl py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white/85">
            Pricing · 一条入口、两条升级路径
          </span>
          <h1 className="mt-6 max-w-3xl text-balance text-4xl font-black leading-[1.06] tracking-[-0.045em] md:text-6xl">
            999 启动包是入口，工具包是结果。
            <br className="hidden md:block" />
            等于一分钱没花，就拿到了完整 AI 落地诊断。
          </h1>
          <p className="mt-6 max-w-3xl text-pretty text-lg leading-8 text-white/70">
            所有客户都从 999 启动包开始：免费 40-60 分钟资深顾问 1v1 诊断 + 50 credits 工具体验 + AI 工具抵扣券。
            后续升级 2999 工具包或 9999 增长陪跑时，999 元全额抵扣首期——咨询服务在话术上是免费的，999 元变成了下一步必然要付的工具包预付款。
          </p>
        </div>
      </section>

      <section className="bg-[#f4f6fb] py-20 text-slate-900">
        <div className="container max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => {
              const isEntry = plan.id === '999';
              const isMonthly = plan.billingCycle === 'monthly';
              const upgrade =
                !isEntry && (plan.id === '2999' || plan.id === '9999')
                  ? calcUpgradeAmount(plan.id, DIAGNOSIS_DEPOSIT_CNY)
                  : null;
              return (
                <div
                  key={plan.id}
                  className={
                    isEntry
                      ? 'relative flex flex-col rounded-3xl bg-[#070b1c] p-8 text-white shadow-xl shadow-slate-900/15'
                      : 'relative flex flex-col rounded-3xl border border-slate-200 bg-white p-8 text-slate-900'
                  }
                >
                  {isEntry && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#00a0e9] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#04122c]">
                      Start Here · 必经入口
                    </div>
                  )}
                  <h3 className="text-xl font-extrabold tracking-tight">{plan.label}</h3>
                  <p
                    className={isEntry ? 'mt-2 text-sm text-white/70' : 'mt-2 text-sm text-slate-500'}
                  >
                    {plan.tagline}
                  </p>

                  <div className="mt-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black tracking-[-0.04em]">
                        {formatYuan(plan.priceCny)}
                      </span>
                      {isMonthly && (
                        <span className={isEntry ? 'text-sm text-white/55' : 'text-sm text-slate-500'}>
                          / 月
                        </span>
                      )}
                    </div>
                    {upgrade && (
                      <p
                        className={
                          isEntry
                            ? 'mt-2 text-xs text-[#00a0e9]'
                            : 'mt-2 text-xs font-semibold text-[#0a6ea3]'
                        }
                      >
                        ↳ 完成 999 启动包后，首期实付 ¥{upgrade.due.toLocaleString()}（已抵扣 ¥
                        {upgrade.discount.toLocaleString()}）
                      </p>
                    )}
                    {isMonthly && (
                      <div
                        className={
                          isEntry ? 'mt-1 text-sm text-white/55' : 'mt-1 text-sm text-slate-500'
                        }
                      >
                        每月 {plan.credits} credits
                      </div>
                    )}
                  </div>

                  <ul className="mt-6 space-y-3 text-sm">
                    {plan.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2">
                        <Check
                          className={
                            isEntry
                              ? 'mt-0.5 h-4 w-4 flex-shrink-0 text-[#00a0e9]'
                              : 'mt-0.5 h-4 w-4 flex-shrink-0 text-slate-900'
                          }
                        />
                        <span className={isEntry ? 'text-white/85' : 'text-slate-700'}>{h}</span>
                      </li>
                    ))}
                  </ul>

                  <p
                    className={
                      isEntry ? 'mt-6 text-xs text-white/55' : 'mt-6 text-xs text-slate-500'
                    }
                  >
                    适合: {plan.recommendedFor}
                  </p>

                  {isEntry ? (
                    <Link
                      href="/pricing/apply"
                      className="mt-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#00a0e9] px-5 py-3 text-sm font-bold text-[#04122c] shadow-lg shadow-[#00a0e9]/25 transition hover:bg-[#28b3f0]"
                    >
                      立即申请 999 启动包
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-600">
                      <p>
                        <span className="font-bold text-slate-900">不能直接购买。</span>
                        请先申请 999 启动包，跑完免费诊断后由顾问帮你在工作台升级；999 元自动抵扣首期。
                      </p>
                      <Link
                        href="/pricing/apply"
                        className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-slate-900 hover:underline"
                      >
                        从启动包开始
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mx-auto mt-16 max-w-3xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h3 className="text-xl font-extrabold tracking-tight">为什么 999 是必经入口？</h3>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <li>
                <span className="font-bold text-slate-900">• 直接买工具是高风险的：</span>
                没有诊断的工具采购，60% 以上会变成"上线没人用、退订也复杂"的沉默成本。先做 40-60 分钟诊断，把"值不值得做"敲定下来。
              </li>
              <li>
                <span className="font-bold text-slate-900">• 咨询服务是免费的：</span>
                999 元的产品定位是"AI 工具抵扣券 + 50 credits 工具体验"——咨询会议本身在话术上完全免费，等于乙方帮甲方做了一次完整盘点。
              </li>
              <li>
                <span className="font-bold text-slate-900">• 升级时一分钱没花：</span>
                30 天内升级 2999 工具包，首期实付 ¥2000；升级 9999 增长陪跑，首期实付 ¥9000。所付的 999 全额抵扣，结果上"等于免费拿到了诊断"。
              </li>
              <li>
                <span className="font-bold text-slate-900">• 中小企业的窗口期：</span>
                大企业转型动辄 18-36 个月。Pontai 专注扶持中小企业 AI 落地，无论是否已经数字化，都能从 999 启动包开始走通。
              </li>
              <li>
                <span className="font-bold text-slate-900">• 合同发票全程合规：</span>
                所有套餐都走电子合同 + 对公打款 + 3% 增值税普通发票，企业财务报销无阻。
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
