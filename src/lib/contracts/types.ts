export interface ContractVariables {
  orderNumber: string;
  signDate: string;
  amount: string;
  listPrice: string;
  earlyBird: boolean;
  credits: number;
  creditsPerMonth?: number;
  durationMonths: number;
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

export type ContractTemplateId = 'consulting-999' | 'saas-2999' | 'annual-36000';
