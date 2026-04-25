import type { BillingCycle } from '@/lib/pricing';

export interface ContractVariables {
  orderNumber: string;
  signDate: string;
  /** 显示用的金额字符串（已格式化） */
  amount: string;
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
