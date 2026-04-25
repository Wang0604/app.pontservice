/**
 * Stage 0 三档套餐定义。
 * 任何页面 / 合同变量 / 邮件模板都应从这里读取，保持一致。
 * 这个模块可以在客户端和服务端使用，不要引入任何服务器专用依赖。
 */

export const PLAN_IDS = ['999', '2999', '9999'] as const;
export type PlanId = (typeof PLAN_IDS)[number];

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
    label: '信息化诊断服务',
    shortLabel: '999 诊断',
    priceCny: 999,
    credits: PLAN_CREDITS['999'],
    billingCycle: 'one_time',
    tagline: '一次诊断，看清一个具体问题',
    highlights: [
      '1 次远程 1v1 会议（60 分钟）',
      '1 份可执行的 PDF 诊断报告',
      '会后 7 天微信答疑',
      '赠送 50 credits 体验工具',
    ],
    contractTemplateId: 'consulting-999',
    recommendedFor: '第一次接触 AI，想先判断问题值不值得做的老板',
  },
  {
    id: '2999',
    label: 'AI 工具 SaaS 订阅',
    shortLabel: '2999 工具包',
    priceCny: 2999,
    credits: PLAN_CREDITS['2999'],
    billingCycle: 'monthly',
    tagline: '月付订阅，按月发放 credits',
    highlights: [
      '工具访问权（按月续费，可随时停用）',
      `每月发放 ${PLAN_CREDITS['2999']} credits（当月未用完不累计）`,
      'OCR 发票工具，后续 SEO / GEO 工具上线后同步开放',
      'SLA 月度可用率 > 99%',
      '邮件支持',
    ],
    contractTemplateId: 'saas-2999',
    recommendedFor: '已经确定要用的老板，希望灵活按月付费',
  },
  {
    id: '9999',
    label: 'AI 增长陪跑包',
    shortLabel: '9999 增长包',
    priceCny: 9999,
    credits: PLAN_CREDITS['9999'],
    billingCycle: 'monthly',
    tagline: '工具包 + 专项诊断 + 陪跑落地（月付）',
    highlights: [
      '包含 2999 工具包全部权益',
      `每月发放 ${PLAN_CREDITS['9999']} credits（当月未用完不累计）`,
      '优先客服响应（工作日 4 小时内）',
      '每月 1 次 SEO / GEO / OCR 专项诊断',
      '每月 1 次定制化 Prompt 或工作流调优',
      '季度复盘会议 1 次',
    ],
    contractTemplateId: 'growth-9999',
    recommendedFor: '已经有明确业务目标，希望有人陪着把 AI 工具用起来的老板',
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
