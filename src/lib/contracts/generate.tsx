import { renderToBuffer } from '@react-pdf/renderer';
import { ContractDocument } from './render-pdf';
import { buildContractVariables, renderContractMarkdown } from './fill-template';
import type { ContractTemplateId, ContractVariables } from './types';
import type { BillingCycle } from '@/lib/pricing';

export async function generateContractPdf(params: {
  orderNumber: string;
  templateId: ContractTemplateId;
  amountCny: number;
  credits: number;
  billingCycle: BillingCycle;
  customer: {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string | null;
  };
  /** 升级订单的标准价；首单可省略，与 amountCny 相同 */
  originalAmountCny?: number;
  /** 升级订单的 999 抵扣金额；首单为 0 */
  discountAmountCny?: number;
}): Promise<{ pdf: Buffer; variables: ContractVariables; markdown: string }> {
  const variables = buildContractVariables(params);
  const markdown = await renderContractMarkdown(params.templateId, variables);
  const element = (
    <ContractDocument markdown={markdown} variables={variables} templateId={params.templateId} />
  );
  const pdf = await renderToBuffer(element);
  return { pdf, variables, markdown };
}
