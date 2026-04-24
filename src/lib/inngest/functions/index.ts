import { generateContractPdfFunction } from './generate-contract-pdf';
import { ocrInvoiceFunction } from './ocr-invoice';

/**
 * All Inngest functions registered with the app.
 * Add new functions here to expose them at /api/inngest.
 */
export const functions = [generateContractPdfFunction, ocrInvoiceFunction];
