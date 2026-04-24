import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * ============================================================
 * Better Auth tables
 * Names must match Better Auth defaults: user / session / account / verification
 * ============================================================
 */

export const users = pgTable(
  'user',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').notNull().default(false),
    name: text('name'),
    image: text('image'),

    fullName: text('full_name'),
    companyName: text('company_name'),
    phone: text('phone'),
    role: text('role').notNull().default('user'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex('user_email_idx').on(t.email),
  }),
);

export const sessions = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const verifications = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * ============================================================
 * Credits System (事实来源 + append-only 流水)
 * ============================================================
 */

export const creditBalances = pgTable(
  'credit_balances',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    availableCredits: integer('available_credits').notNull().default(0),
    totalGranted: integer('total_granted').notNull().default(0),
    totalConsumed: integer('total_consumed').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    availableNonNegative: check('credit_balances_available_non_negative', sql`${t.availableCredits} >= 0`),
  }),
);

export const creditTransactions = pgTable(
  'credit_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    amount: integer('amount').notNull(),
    type: text('type').notNull(),
    reason: text('reason'),
    orderId: uuid('order_id'),
    toolRunId: uuid('tool_run_id'),
    balanceAfter: integer('balance_after').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index('credit_txn_user_created_idx').on(t.userId, t.createdAt),
    typeIdx: index('credit_txn_type_idx').on(t.type),
  }),
);

/**
 * ============================================================
 * Tools & Files
 * ============================================================
 */

export const toolRuns = pgTable(
  'tool_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    toolSlug: text('tool_slug').notNull(),
    status: text('status').notNull().default('pending'),
    input: jsonb('input'),
    output: jsonb('output'),
    error: text('error'),
    creditsCost: integer('credits_cost').notNull().default(0),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userStatusIdx: index('tool_runs_user_status_idx').on(t.userId, t.status),
    createdIdx: index('tool_runs_created_idx').on(t.createdAt),
  }),
);

export const files = pgTable(
  'files',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => users.id),
    storageKey: text('storage_key').notNull().unique(),
    filename: text('filename').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    mimeType: text('mime_type').notNull(),
    uploadStatus: text('upload_status').notNull().default('pending'),
    purpose: text('purpose'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index('files_user_created_idx').on(t.userId, t.createdAt),
    expiresIdx: index('files_expires_idx').on(t.expiresAt),
  }),
);

/**
 * ============================================================
 * Paperwork: Leads -> Orders -> Contracts -> Receipts
 * ============================================================
 */

export const leads = pgTable(
  'leads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => users.id),
    companyName: text('company_name').notNull(),
    contactName: text('contact_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    interestedPlan: text('interested_plan').notNull(),
    useCase: text('use_case'),
    notes: text('notes'),
    source: text('source').default('organic'),
    status: text('status').notNull().default('new'),
    assignedTo: text('assigned_to').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index('leads_status_idx').on(t.status, t.createdAt),
    emailIdx: index('leads_email_idx').on(t.email),
  }),
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderNumber: text('order_number').notNull().unique(),
    leadId: uuid('lead_id').references(() => leads.id),
    userId: text('user_id').references(() => users.id),
    planType: text('plan_type').notNull(),
    amountCny: numeric('amount_cny', { precision: 10, scale: 2 }).notNull(),
    earlyBird: boolean('early_bird').notNull().default(false),
    actualAmountCny: numeric('actual_amount_cny', { precision: 10, scale: 2 }).notNull(),
    paperworkStatus: text('paperwork_status').notNull().default('draft'),
    contractId: uuid('contract_id'),
    paymentMethod: text('payment_method').default('bank_transfer'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    activatedAt: timestamp('activated_at', { withTimezone: true }),
    creditsGranted: integer('credits_granted'),
    invoiceNumber: text('invoice_number'),
    invoiceR2Key: text('invoice_r2_key'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index('orders_user_created_idx').on(t.userId, t.createdAt),
    paperworkStatusIdx: index('orders_paperwork_status_idx').on(t.paperworkStatus, t.createdAt),
  }),
);

export const contracts = pgTable(
  'contracts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    templateId: text('template_id').notNull(),
    variables: jsonb('variables').notNull(),
    pdfR2Key: text('pdf_r2_key'),
    status: text('status').notNull().default('draft'),
    esignProvider: text('esign_provider'),
    esignTaskId: text('esign_task_id'),
    esignSignUrl: text('esign_sign_url'),
    approvedBy: text('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    signedAt: timestamp('signed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orderIdx: index('contracts_order_idx').on(t.orderId),
    statusIdx: index('contracts_status_idx').on(t.status),
  }),
);

export const paymentReceipts = pgTable(
  'payment_receipts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    fileId: uuid('file_id').references(() => files.id),
    bankReference: text('bank_reference'),
    amountCny: numeric('amount_cny', { precision: 10, scale: 2 }).notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    uploadedBy: text('uploaded_by').references(() => users.id),
    verifiedBy: text('verified_by').references(() => users.id),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    verificationNote: text('verification_note'),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orderIdx: index('receipts_order_idx').on(t.orderId),
    statusIdx: index('receipts_status_idx').on(t.status),
  }),
);

/**
 * ============================================================
 * Stage 1/2 预留：外部支付 webhook 事件（Stripe / 微信 / 支付宝）
 * Stage 0 只建表，不使用
 * ============================================================
 */

export const paymentEvents = pgTable(
  'payment_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: text('event_id').notNull().unique(),
    provider: text('provider').notNull(),
    rawPayload: jsonb('raw_payload').notNull(),
    orderId: uuid('order_id').references(() => orders.id),
    processed: boolean('processed').notNull().default(false),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    providerProcessedIdx: index('payment_events_provider_processed_idx').on(t.provider, t.processed),
  }),
);

/**
 * ============================================================
 * Type exports
 * ============================================================
 */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CreditBalance = typeof creditBalances.$inferSelect;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;
export type ToolRun = typeof toolRuns.$inferSelect;
export type NewToolRun = typeof toolRuns.$inferInsert;
export type FileRecord = typeof files.$inferSelect;
export type NewFileRecord = typeof files.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;
export type PaymentReceipt = typeof paymentReceipts.$inferSelect;
export type NewPaymentReceipt = typeof paymentReceipts.$inferInsert;
export type PaymentEvent = typeof paymentEvents.$inferSelect;

/**
 * ============================================================
 * Enumerations (用字面量类型约束 status 等字段)
 * ============================================================
 */

export const CREDIT_TXN_TYPES = ['grant', 'consume', 'refund', 'adjust'] as const;
export type CreditTxnType = (typeof CREDIT_TXN_TYPES)[number];

export const TOOL_RUN_STATUSES = ['pending', 'running', 'succeeded', 'failed', 'refunded'] as const;
export type ToolRunStatus = (typeof TOOL_RUN_STATUSES)[number];

export const LEAD_STATUSES = [
  'new',
  'contacted',
  'approved',
  'contract_sent',
  'contract_signed',
  'paid',
  'activated',
  'lost',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const PAPERWORK_STATUSES = [
  'draft',
  'pending_approval',
  'contract_sent',
  'contract_signed',
  'awaiting_payment',
  'payment_submitted',
  'activated',
  'cancelled',
] as const;
export type PaperworkStatus = (typeof PAPERWORK_STATUSES)[number];

export const CONTRACT_STATUSES = ['draft', 'approved', 'sent', 'viewing', 'signed', 'voided'] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const RECEIPT_STATUSES = ['pending', 'verified', 'rejected'] as const;
export type ReceiptStatus = (typeof RECEIPT_STATUSES)[number];

export const PLAN_TYPES = ['999', '2999', '36000'] as const;
export type PlanType = (typeof PLAN_TYPES)[number];

export const USER_ROLES = ['user', 'staff', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];
