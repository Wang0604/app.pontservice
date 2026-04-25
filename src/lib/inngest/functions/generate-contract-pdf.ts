import { eq } from 'drizzle-orm';
import { inngest } from '../client';
import { db } from '@/lib/db';
import { contracts, orders, leads } from '@/lib/db/schema';
import { generateContractPdf } from '@/lib/contracts/generate';
import { storageProvider } from '@/lib/providers/storage/r2';
import { getPlan } from '@/lib/pricing';
import type { ContractTemplateId } from '@/lib/contracts/types';

export const generateContractPdfFunction = inngest.createFunction(
  { id: 'generate-contract-pdf', retries: 2 },
  { event: 'contract/generate.requested' },
  async ({ event, step }) => {
    const contractId = event.data.contractId as string;

    const contract = await step.run('load contract', async () => {
      const rows = await db.select().from(contracts).where(eq(contracts.id, contractId));
      if (rows.length === 0) throw new Error(`contract ${contractId} not found`);
      return rows[0];
    });

    const order = await step.run('load order', async () => {
      const rows = await db.select().from(orders).where(eq(orders.id, contract.orderId));
      if (rows.length === 0) throw new Error(`order ${contract.orderId} not found`);
      return rows[0];
    });

    const lead = await step.run('load lead', async () => {
      if (!order.leadId) throw new Error('order has no lead');
      const rows = await db.select().from(leads).where(eq(leads.id, order.leadId));
      if (rows.length === 0) throw new Error(`lead ${order.leadId} not found`);
      return rows[0];
    });

    const plan = getPlan(order.planType);
    if (!plan) throw new Error(`unknown plan ${order.planType}`);

    const key = `contracts/${contract.id}/v1-${Date.now()}.pdf`;

    // Buffer can't cross step boundaries via JSON serialization, so we
    // render + upload in one step and only return the key.
    const pdfKey = await step.run('render and upload pdf', async () => {
      const { pdf } = await generateContractPdf({
        orderNumber: order.orderNumber,
        templateId: contract.templateId as ContractTemplateId,
        amountCny: parseFloat(order.actualAmountCny),
        credits: plan.credits,
        billingCycle: plan.billingCycle,
        customer: {
          companyName: lead.companyName,
          contactName: lead.contactName,
          email: lead.email,
          phone: lead.phone,
        },
      });
      await storageProvider.putObject({
        key,
        body: pdf,
        contentType: 'application/pdf',
      });
      return key;
    });

    await step.run('save key to db', async () => {
      await db
        .update(contracts)
        .set({ pdfR2Key: pdfKey, updatedAt: new Date() })
        .where(eq(contracts.id, contractId));
    });

    return { contractId, pdfKey };
  },
);
