import Handlebars from 'handlebars';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { ContractTemplateId, ContractVariables } from './types';
import type { BillingCycle } from '@/lib/pricing';

const TEMPLATE_DIR = path.join(process.cwd(), 'src/lib/contracts/templates');
const CACHE = new Map<string, Handlebars.TemplateDelegate>();

export async function getCompiledTemplate(templateId: ContractTemplateId) {
  const cached = CACHE.get(templateId);
  if (cached) return cached;

  const file = path.join(TEMPLATE_DIR, `${templateId}.md`);
  const raw = await fs.readFile(file, 'utf8');
  const compiled = Handlebars.compile(raw, { noEscape: true });
  CACHE.set(templateId, compiled);
  return compiled;
}

export async function renderContractMarkdown(
  templateId: ContractTemplateId,
  variables: ContractVariables,
): Promise<string> {
  const template = await getCompiledTemplate(templateId);
  return template(variables);
}

/**
 * Build the variables object from app data.
 * Called by admin when generating / preview contract.
 */
export function buildContractVariables(params: {
  orderNumber: string;
  amountCny: number;
  credits: number;
  billingCycle: BillingCycle;
  customer: {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string | null;
  };
  signDate?: Date;
}): ContractVariables {
  const signDate = (params.signDate ?? new Date()).toISOString().slice(0, 10);

  return {
    orderNumber: params.orderNumber,
    signDate,
    amount: params.amountCny.toLocaleString('zh-CN', { minimumFractionDigits: 0 }),
    credits: params.credits,
    billingCycle: params.billingCycle,
    customer: {
      companyName: params.customer.companyName,
      contactName: params.customer.contactName,
      email: params.customer.email,
      phone: params.customer.phone ?? undefined,
    },
    provider: {
      companyName: process.env.COMPANY_NAME ?? '[公司全称待配置]',
      unifiedSocialCreditCode: process.env.COMPANY_UNIFIED_SOCIAL_CREDIT_CODE ?? '[待配置]',
      legalRepresentative: process.env.COMPANY_LEGAL_REPRESENTATIVE ?? '[待配置]',
      address: process.env.COMPANY_ADDRESS ?? '[待配置]',
      bankAccountName: process.env.BANK_ACCOUNT_NAME ?? '[待配置]',
      bankName: process.env.BANK_NAME ?? '[待配置]',
      bankBranch: process.env.BANK_BRANCH ?? '[待配置]',
      bankAccountNumber: process.env.BANK_ACCOUNT_NUMBER ?? '[待配置]',
      legalVenue: process.env.COMPANY_ADDRESS?.split(/[省市区县]/)[0] ?? '北京市',
    },
  };
}
