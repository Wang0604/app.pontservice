/**
 * Stage 0 三档套餐定义。
 * 任何页面 / 合同变量 / 邮件模板都应从这里读取，保持一致。
 * 这个模块可以在客户端和服务端使用，不要引入任何服务器专用依赖。
 */

export const PLAN_CREDITS: Record<string, number> = {
  '999': 50,
  '2999': 2400,
  '36000': 2400,
};

export interface PlanDefinition {
  id: '999' | '2999' | '36000';
  label: string;
  shortLabel: string;
  listPriceCny: number;
  earlyBirdPriceCny: number;
  credits: number;
  durationMonths: number;
  tagline: string;
  highlights: string[];
  contractTemplateId: 'consulting-999' | 'saas-2999' | 'annual-36000';
  recommendedFor: string;
}

export const PLANS: PlanDefinition[] = [
  {
    id: '999',
    label: '信息化咨询服务',
    shortLabel: '999 咨询',
    listPriceCny: 999,
    earlyBirdPriceCny: 999,
    credits: PLAN_CREDITS['999'],
    durationMonths: 0,
    tagline: '一次咨询，解决一个具体问题',
    highlights: [
      '1 次远程 1v1 会议（60 分钟）',
      '1 份可执行的 PDF 诊断报告',
      '会后 7 天微信答疑',
      '赠送 50 credits 体验工具',
    ],
    contractTemplateId: 'consulting-999',
    recommendedFor: '第一次接触 AI，想先看看能不能解决自己问题的老板',
  },
  {
    id: '2999',
    label: 'AI 工具 SaaS 订阅',
    shortLabel: '2999 工具包',
    listPriceCny: 2999,
    earlyBirdPriceCny: 1999,
    credits: PLAN_CREDITS['2999'],
    durationMonths: 12,
    tagline: '12 个月长期使用，按月发放 credits',
    highlights: [
      '12 个月工具访问权',
      '每月发放 200 credits（年度累计 2400）',
      'OCR 发票、SEO 诊断等全部工具',
      'SLA 月度可用率 > 99%',
      '邮件支持',
    ],
    contractTemplateId: 'saas-2999',
    recommendedFor: '已经确定要用的老板，希望稳定可预期的预算',
  },
  {
    id: '36000',
    label: '年度服务协议',
    shortLabel: '36000 年付',
    listPriceCny: 36000,
    earlyBirdPriceCny: 24000,
    credits: PLAN_CREDITS['36000'],
    durationMonths: 12,
    tagline: '全包套餐，一次到位',
    highlights: [
      '12 个月全工具访问权',
      '2400 credits 一次性到账',
      '优先客服响应（工作日 4 小时内）',
      '2 次定制化 prompt 调优',
      '年度战略咨询 1 次',
    ],
    contractTemplateId: 'annual-36000',
    recommendedFor: '规模较大、对交付速度要求高的客户',
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
