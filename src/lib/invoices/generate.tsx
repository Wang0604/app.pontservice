import { renderToBuffer } from '@react-pdf/renderer';
import { InvoiceDocument, type InvoiceData } from './render-pdf';

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return await renderToBuffer(<InvoiceDocument data={data} />);
}

export function buildInvoiceData(params: {
  invoiceNumber: string;
  buyerName: string;
  buyerTaxId?: string | null;
  totalAmount: number;
  itemName?: string;
}): InvoiceData {
  const taxRate = 0.03;
  const amountPreTax = params.totalAmount / (1 + taxRate);
  const tax = params.totalAmount - amountPreTax;

  return {
    invoiceNumber: params.invoiceNumber,
    issueDate: new Date().toISOString().slice(0, 10),
    buyerName: params.buyerName,
    buyerTaxId: params.buyerTaxId ?? undefined,
    sellerName: process.env.COMPANY_NAME ?? '[销方待配置]',
    sellerTaxId: process.env.COMPANY_UNIFIED_SOCIAL_CREDIT_CODE ?? '[销方税号待配置]',
    itemName: params.itemName ?? '技术服务费',
    amountPreTax: Math.round(amountPreTax * 100) / 100,
    taxRate,
    tax: Math.round(tax * 100) / 100,
    total: params.totalAmount,
  };
}
