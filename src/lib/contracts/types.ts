import type { BillingCycle } from '@/lib/pricing';

export interface ContractVariables {
  orderNumber: string;
  signDate: string;
  /** 显示用的实付金额字符串（已格式化）。升级订单为抵扣后差额，首单为标价。 */
  amount: string;
  /** 升级订单的标准价（已格式化字符串），首单与 amount 相同 */
  originalAmount: string;
  /** 升级订单使用的 999 启动包抵扣金额（已格式化字符串），首单为 '0' */
  discountAmount: string;
  /** 单期 / 单月发放的 credits */
  credits: number;
  /** 'monthly' = 按月订阅；'one_time' = 一次性服务 */
  billingCycle: BillingCycle;
  customer: {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
  };
  provider: {
    companyName: string;
    unifiedSocialCreditCode: string;
    legalRepresentative: string;
    address: string;
    bankAccountName: string;
    bankName: string;
    bankBranch: string;
    bankAccountNumber: string;
    legalVenue: string;
  };
}

export type ContractTemplateId = 'consulting-999' | 'saas-2999' | 'growth-9999';
