/**
 * Stage 0 套餐定义 + 升级抵扣规则。
 * 任何页面 / 合同变量 / 邮件模板都应从这里读取，保持一致。
 * 这个模块可以在客户端和服务端使用，不要引入任何服务器专用依赖。
 *
 * 产品逻辑（重要）：
 * - 999 是所有客户的必经入场券（"AI 落地启动包"）。
 *   - 客户付 999，免费获得 40-60 分钟 AI 落地诊断咨询会议（顾问 1v1）+ 50 credits 工具体验。
 *   - 这 999 同时是抵扣券：升级 2999 工具包或 9999 增长陪跑时全额抵扣。
 *   - 话术上：咨询是"免费"的，999 等于工具抵扣券，客户最终等于"一分钱没花"就拿到了完整诊断。
 * - 2999 / 9999 不再作为独立首单售卖，统一通过升级路径生成；首单永远是 999。
 */

export const PLAN_IDS = ['999', '2999', '9999'] as const;
export type PlanId = (typeof PLAN_IDS)[number];

/** 启动包/抵扣券金额。后台升级订单时会从 2999/9999 标价里扣掉这一笔。 */
export const DIAGNOSIS_DEPOSIT_CNY = 999;

/** 入场套餐 id：所有 lead 的首单都用这个 plan。 */
export const ENTRY_PLAN_ID: PlanId = '999';

/** 后续升级时可选的目标 plan。 */
export const UPGRADE_PLAN_IDS: PlanId[] = ['2999', '9999'];

export const PLAN_CREDITS: Record<PlanId, number> = {
  '999': 50,
  '2999': 200,
  '9999': 500,
};

export type BillingCycle = 'one_time' | 'monthly';

export interface PlanDefinition {
  id: PlanId;
  label: string;
  shortLabel: string;
  /** 单次或单月价格（人民币元，含税） */
  priceCny: number;
  /** 单次发放或每月发放的 credits 数 */
  credits: number;
  billingCycle: BillingCycle;
  tagline: string;
  highlights: string[];
  contractTemplateId: 'consulting-999' | 'saas-2999' | 'growth-9999';
  recommendedFor: string;
}

export const PLANS: PlanDefinition[] = [
  {
    id: '999',
    label: 'AI 落地启动包',
    shortLabel: '999 启动包',
    priceCny: 999,
    credits: PLAN_CREDITS['999'],
    billingCycle: 'one_time',
    tagline: '一次付费，开启企业 AI 落地的第一步',
    highlights: [
      '免费 40-60 分钟 AI 落地诊断咨询会议（资深顾问 1v1）',
      '免费输出一份《企业 AI 落地路线图》PDF 报告',
      '会后 7 天微信答疑，把执行细节交代清楚',
      '附赠 50 credits 立刻体验 OCR、SEO / GEO 等工具',
      '999 元等于 AI 工具抵扣券：后续升级 2999 工具包 / 9999 增长包，全额抵扣首期',
    ],
    contractTemplateId: 'consulting-999',
    recommendedFor: '所有想真正把 AI 用起来的中小企业老板（必经的第一步）',
  },
  {
    id: '2999',
    label: 'AI 工具 SaaS 订阅',
    shortLabel: '2999 工具包',
    priceCny: 2999,
    credits: PLAN_CREDITS['2999'],
    billingCycle: 'monthly',
    tagline: '在 999 启动包之后，按月解锁完整 AI 工具矩阵',
    highlights: [
      '完整工具访问权（按月续费，可随时停用）',
      `每月发放 ${PLAN_CREDITS['2999']} credits（当月未用完不累计）`,
      'OCR 发票工具立即开放，SEO / GEO 工具上线后同步开放',
      '已支付的 999 启动包全额抵扣首期，首月只补差 ¥2000',
      'SLA 月度可用率 > 99%，邮件支持',
    ],
    contractTemplateId: 'saas-2999',
    recommendedFor: '已经完成 999 诊断、确定要把 AI 工具长期用起来的老板',
  },
  {
    id: '9999',
    label: 'AI 增长陪跑包',
    shortLabel: '9999 增长包',
    priceCny: 9999,
    credits: PLAN_CREDITS['9999'],
    billingCycle: 'monthly',
    tagline: '工具 + 专项诊断 + 顾问陪跑（在 999 启动包之后启用）',
    highlights: [
      '包含 2999 工具包全部权益',
      `每月发放 ${PLAN_CREDITS['9999']} credits（当月未用完不累计）`,
      '优先客服响应（工作日 4 小时内）',
      '每月 1 次 SEO / GEO / OCR 专项诊断',
      '每月 1 次定制化 Prompt 或工作流调优',
      '季度复盘会议 1 次',
      '已支付的 999 启动包全额抵扣首期，首月只补差 ¥9000',
    ],
    contractTemplateId: 'growth-9999',
    recommendedFor: '完成 999 诊断后，希望有人陪着把 AI 工具长期落到流程里的老板',
  },
];

export function getPlan(id: string): PlanDefinition | undefined {
  return PLANS.find((p) => p.id === id);
}

export function getPlanLabel(id: string): string {
  return getPlan(id)?.label ?? id;
}

export function getPlanShortLabel(id: string): string {
  return getPlan(id)?.shortLabel ?? id;
}

export function isMonthlyPlan(id: string): boolean {
  return getPlan(id)?.billingCycle === 'monthly';
}

/**
 * 计算从 999 启动包升级到目标 plan 时的抵扣后金额。
 * 返回值用于后台升级订单时设置 `actualAmountCny`。
 */
export function calcUpgradeAmount(targetPlan: PlanId, priorPaidCny = DIAGNOSIS_DEPOSIT_CNY) {
  const plan = getPlan(targetPlan);
  if (!plan) throw new Error(`unknown plan ${targetPlan}`);
  const original = plan.priceCny;
  const discount = Math.min(priorPaidCny, original);
  const due = Math.max(original - discount, 0);
  return { original, discount, due };
}
