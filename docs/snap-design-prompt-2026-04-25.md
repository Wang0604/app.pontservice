# Pontai Stage 0 Design MD for Snap

**Date**: 2026-04-25  
**Product**: Pontai / app.pontservice  
**Stage**: Stage 0 MVP, first real B2B order  
**Purpose**: This document is written as a design prompt and product design brief. It can be uploaded to Snap to generate or refine frontend and product design.

---

## 1. Snap Design Prompt

Design a clean, trustworthy B2B SaaS website and dashboard for **Pontai**, a practical AI tool and consulting product for small and medium business owners in China.

The product should feel serious enough for company purchasing, contracts, invoices, and bank transfer, but still simple enough for a founder-led MVP. The visual tone should be calm, professional, minimal, and business-friendly. Avoid flashy AI hype. The main user is a traditional business owner who wants to know whether AI can solve a concrete operational problem.

Pontai has three current paid offers:

- **999 Diagnosis**: one-time information diagnosis service. Includes one 60-minute remote meeting, one actionable PDF report, 7 days of WeChat Q&A, and 50 trial credits.
- **2999 Tool Pack**: monthly SaaS subscription. Includes access to AI tools, 200 credits per month, OCR invoice recognition now, and SEO / GEO tools when they launch.
- **9999 Growth Package**: monthly assisted growth package. Includes everything in the 2999 plan, 500 credits per month, priority support, one monthly SEO / GEO / OCR diagnosis, one monthly prompt or workflow optimization, and one quarterly review.

The primary conversion flow is:

1. Visitor lands on home page.
2. Visitor reads clear explanation of the three offers.
3. Visitor opens `/pricing`.
4. Visitor chooses a plan and submits `/pricing/apply`.
5. Admin reviews the lead.
6. Admin approves and generates a contract.
7. Customer signs contract.
8. Customer sees bank transfer instructions.
9. Admin verifies payment.
10. Customer account is activated, credits are granted, invoice PDF is emailed.
11. Customer logs in and uses the OCR invoice tool.

Create a frontend design system and screen flow that supports this journey with minimal friction, clear trust signals, and strong B2B compliance cues.

---

## 2. Product Positioning

Pontai is not a generic AI chatbot. It is a B2B workflow product for owners of small and medium businesses who need concrete AI outcomes.

The product promise:

- Find one concrete business problem.
- Diagnose whether AI can solve it.
- Provide a tool and credits system to use it repeatedly.
- Add human assistance when the customer needs help turning the tool into workflow.

Core message:

> 先做诊断看清问题，再用工具和陪跑把结果落地。

English design translation:

> Diagnose the problem first. Then use AI tools and guided support to make the workflow actually work.

---

## 3. Design Principles

### 3.1 Trust Before Excitement

The interface should emphasize contracts, invoices, bank transfer, data ownership, and clear service boundaries. The customer should feel this is a real business service, not a demo.

### 3.2 Three-Step Mental Model

The product should consistently explain the three-step ladder:

- 999: diagnose the problem.
- 2999: use the tools.
- 9999: get guided implementation.

### 3.3 Human-In-The-Loop Is A Feature

Stage 0 intentionally uses manual review, contract approval, and bank transfer. The design should present this as professional onboarding, not as a missing automation.

### 3.4 Avoid Overbuilding

Do not design Stripe, WeChat Pay, Alipay, complex analytics, multiple admin roles, or self-serve contract editing for Stage 0.

### 3.5 Make The First Order Feel Safe

The first real customer should be able to understand every step: apply, get reviewed, sign, pay, activate, use the tool, receive invoice.

---

## 4. Users

### 4.1 Business Owner

Profile:

- Runs a small or medium business.
- May not understand AI deeply.
- Wants practical efficiency gains.
- Cares about invoice, contract, reimbursement, and data safety.

Needs:

- Understand what each package gives.
- Know whether AI can solve their specific problem.
- Submit company and contact details.
- Receive a contract and invoice.
- Log in and use the tool without technical friction.

### 4.2 Admin / Founder

Profile:

- Reviews each incoming lead manually.
- Adjusts final price when needed.
- Generates and sends contracts.
- Verifies bank transfer.
- Activates accounts and grants credits.

Needs:

- See lead list and status.
- Review company, contact, plan, and use case.
- Approve or mark lost.
- Generate contract PDF.
- Send contract to customer.
- Verify payment and activate order.

---

## 5. Current Product Scope

### 5.1 In Scope For Stage 0

- Marketing home page.
- Pricing page with three plans.
- Apply form.
- Authentication with phone, email, password, and SMS stub.
- Admin lead review.
- Contract generation from Markdown templates.
- Stub e-sign flow with written fallback.
- Bank transfer instruction page.
- Payment receipt upload.
- Manual admin activation.
- Invoice PDF generation and email.
- Credits system.
- OCR invoice tool.
- DeepSeek and Anthropic provider usage.

### 5.2 Out Of Scope For Stage 0

- Stripe.
- WeChat Pay.
- Alipay.
- ICP filing.
- Alibaba Cloud migration.
- Sentry, PostHog, or other observability products.
- Full SEO / GEO tools implementation.
- Google OAuth.
- Real SMS gateway.
- Self-serve contract edits.
- Multi-role approval workflow.

---

## 6. Pricing Design

### 6.1 999 Diagnosis

Internal ID: `999`  
Billing: one-time  
Price: `¥999`  
Credits: `50`

Frontend label:

- Short: `999 诊断`
- Full: `信息化诊断服务`
- Tagline: `一次诊断，看清一个具体问题`

Benefits:

- 1 remote 1v1 meeting, 60 minutes.
- 1 actionable PDF diagnosis report.
- 7 days WeChat Q&A.
- 50 trial credits.

Best for:

- First-time AI customers.
- Business owners unsure whether their problem is worth solving.

Design emphasis:

- Low-risk entry.
- Clear and concrete outcome.
- Good bridge into 2999 or 9999.

### 6.2 2999 Tool Pack

Internal ID: `2999`  
Billing: monthly  
Price: `¥2999 / month`  
Credits: `200 / month`

Frontend label:

- Short: `2999 工具包`
- Full: `AI 工具 SaaS 订阅`
- Tagline: `月付订阅，按月发放 credits`

Benefits:

- Monthly access to AI tools.
- 200 credits per month.
- OCR invoice tool now.
- SEO / GEO tools when they launch.
- SLA monthly availability above 99%.
- Email support.

Best for:

- Customers who already know they want to use AI tools.
- Customers who want flexible monthly payment.

Design emphasis:

- Mark this as the recommended or most selected plan.
- It is the main Stage 0 revenue product.

### 6.3 9999 Growth Package

Internal ID: `9999`  
Billing: monthly  
Price: `¥9999 / month`  
Credits: `500 / month`

Frontend label:

- Short: `9999 增长包`
- Full: `AI 增长陪跑包`
- Tagline: `工具包 + 专项诊断 + 陪跑落地（月付）`

Benefits:

- Includes all 2999 Tool Pack benefits.
- 500 credits per month.
- Priority response within 4 working hours.
- 1 monthly SEO / GEO / OCR diagnosis.
- 1 monthly prompt or workflow optimization.
- 1 quarterly review meeting.

Best for:

- Customers with a clear business goal.
- Customers who need help turning tools into a real workflow.

Design emphasis:

- This is not only higher credits.
- It sells guided implementation, diagnosis, and business workflow support.

---

## 7. Information Architecture

### 7.1 Public Marketing

Routes:

- `/`
- `/pricing`
- `/pricing/apply`
- `/pricing/apply/success`
- `/cases` as future case library

Home page requirements:

- Hero headline: AI tools and diagnosis for small and medium business owners.
- Subheadline: diagnose first, then implement with tools and guided support.
- Primary CTA: view three plans.
- Secondary CTA: view cases, can be placeholder in Stage 0.
- Three feature cards: AI tools, 999 diagnosis, compliance.

Pricing page requirements:

- Title: `从诊断到落地的三档服务`
- Subtitle: emphasize problem diagnosis, tool usage, contracts, invoices, and company reimbursement.
- Three plan cards.
- 2999 card visually highlighted as most selected.
- Each plan card shows price, billing period, credits, benefits, recommended user, and apply CTA.
- Explanation block: how to choose among the three plans.

Apply page requirements:

- Back link to pricing.
- Card title: `申请签约`
- Explain that the team reviews within 1 working day and sends contract link after approval.
- If logged in, prefill user info.
- If anonymous, explain that application is still accepted and account will be created after approval.

Apply form fields:

- Company full name.
- Contact name.
- Phone.
- Enterprise email.
- Interested plan.
- Use case.
- Notes.

Use case placeholder:

> 例如：每月 200 张发票人工录入要 3 天；或者想知道自己的网站在 DeepSeek / Claude 里能不能被推荐。

### 7.2 Customer App

Routes:

- `/account`
- `/orders`
- `/orders/[id]`
- `/contracts/[id]`
- `/tools/ocr-invoice`

Customer order page requirements:

- Show order number.
- Show selected plan.
- Show current status.
- Show contract status.
- Show bank transfer instructions after contract is signed.
- Show upload receipt action.
- Show activation state after admin verification.

Contract page requirements:

- Show embedded PDF preview.
- Show clear sign button in stub mode.
- Explain written fallback: customer may print, sign, scan, and return.
- After signing, route customer toward payment instructions.

OCR tool page requirements:

- Upload PDF or image.
- Show credit cost before running.
- Show processing state.
- Poll result status.
- Show structured output.
- Show failure state and automatic refund message when applicable.

### 7.3 Admin App

Routes:

- `/admin`
- `/admin/leads`
- `/admin/leads/[id]`
- `/admin/orders`
- `/admin/orders/[id]`

Admin dashboard requirements:

- New leads count.
- Pending approval count.
- Pending signature count.
- Pending reconciliation count.
- Activated in last 30 days.

Lead list requirements:

- Filter by status.
- Show company, contact, plan, created time, and status.

Lead detail requirements:

- Company information.
- Contact information.
- Interested plan.
- Use case and notes.
- Related order information.
- Approval panel.

Approval panel requirements:

- Show final price input.
- Show current lead and paperwork status.
- Actions:
  - approve and generate contract.
  - preview contract PDF.
  - send contract to customer.
  - mark lost.

Order detail requirements:

- Show bank transfer and receipt status.
- Verify payment.
- Activate account.
- Generate invoice.
- Send activation email.

---

## 8. Core User Flows

### 8.1 Lead To Contract Flow

1. Customer visits `/pricing`.
2. Customer selects plan.
3. Customer submits `/pricing/apply`.
4. Backend creates `leads` row.
5. Backend creates `orders` row with `paperworkStatus = draft`.
6. Backend sends admin notification email through Resend.
7. Admin opens lead detail.
8. Admin approves order.
9. Backend creates contract row with correct template.
10. Inngest generates contract PDF.
11. Admin previews and sends contract.
12. Customer receives email.

### 8.2 Contract To Payment Flow

1. Customer opens `/contracts/[id]`.
2. Customer previews PDF.
3. Customer clicks confirm signing.
4. System marks contract as signed in stub mode.
5. System sends payment instruction email.
6. Customer opens order page.
7. Customer sees bank account details.
8. Customer transfers money with order number as note.
9. Customer optionally uploads payment receipt.

### 8.3 Payment To Activation Flow

1. Admin opens order detail.
2. Admin verifies transfer manually.
3. Admin activates order.
4. System creates or matches user.
5. System grants credits according to plan.
6. System generates invoice PDF.
7. System stores invoice in R2.
8. System sends activation email with invoice attachment.
9. Customer logs in and uses tools.

### 8.4 OCR Tool Flow

1. Customer opens `/tools/ocr-invoice`.
2. Customer uploads file.
3. API deducts 5 credits.
4. API creates `tool_runs` row.
5. Inngest starts OCR process.
6. DeepSeek extracts raw text.
7. Anthropic structures the result.
8. System saves structured output to `tool_runs`.
9. Frontend polls status and displays result.
10. If processing fails, credits are refunded automatically.

---

## 9. Backend Design

### 9.1 Stack

- Next.js 14 App Router.
- TypeScript strict.
- Drizzle ORM.
- Railway PostgreSQL.
- Better Auth.
- Inngest for async jobs.
- Cloudflare R2 for file storage.
- Resend for email.
- DeepSeek for OCR/raw model work.
- Anthropic Claude for structured reasoning and JSON output.

### 9.2 Domain Modules

Pricing:

- Source of truth: `src/lib/pricing.ts`.
- Exports `PLAN_IDS`, `PlanId`, `PLAN_CREDITS`, `PLANS`.
- All pages, lead validation, contracts, and email templates should read plan data from this module.

Leads:

- Created when a customer submits application.
- Used by admin to review and approve.
- Stores company, contact, plan, use case, notes, source, status.

Orders:

- Created with each lead.
- Tracks plan type, amount, actual amount, paperwork status, contract ID, payment and activation fields.

Contracts:

- Generated from Markdown templates.
- Template IDs:
  - `consulting-999`
  - `saas-2999`
  - `growth-9999`
- Rendered to PDF and stored in R2.

Credits:

- Uses append-only transactions.
- Uses row locks for consume and grant.
- Supports grant, consume, refund, and adjust.
- Welcome credits are granted once after registration.

Tool Runs:

- Tracks file processing.
- Stores status, input, output, error, timestamps.
- Used for OCR now and should be reused for SEO / GEO tools later.

Files:

- Stores uploaded file metadata.
- Actual file content is stored in R2.

Payment Receipts:

- Stores customer-uploaded transfer receipt metadata.
- Admin verifies manually.

### 9.3 Provider Boundaries

Storage provider:

- R2 is current implementation.
- Should provide upload, download, presigned URL, and put object behavior.

Email provider:

- Resend is current implementation.
- Used for admin lead notification, contract ready email, payment instruction email, activation email, and invoice attachment.

E-sign provider:

- Current provider is `stub`.
- Customer click is treated as signature for Stage 0.
- Real providers such as 法大大 or e签宝 should implement the same provider interface later.

SMS provider:

- Current provider is `stub`.
- Real SMS gateway should be added only after first order proves demand.

LLM providers:

- DeepSeek provider for cost-effective OCR/raw text extraction and future tool logic.
- Anthropic provider for structured post-processing and higher-quality reasoning.

---

## 10. AI Tool Design

### 10.1 OCR Invoice Tool

Current tool:

- Route: `/tools/ocr-invoice`
- Run API: `/api/tools/ocr-invoice/run`
- Status API: `/api/tools/ocr-invoice/status`
- Cost: 5 credits per run.
- Prompt: `prompts/ocr-invoice-v1.md`

Processing:

- Customer uploads file.
- System creates file record.
- System deducts credits.
- Inngest receives event.
- DeepSeek extracts raw OCR text.
- Anthropic converts raw OCR into structured JSON.
- System writes output into `tool_runs`.
- Frontend polls and displays status/result.

Failure behavior:

- Mark tool run as failed.
- Refund credits.
- Show readable error state.

### 10.2 SEO Tool Future Direction

The SEO tool should not be built in Stage 0 unless OCR is already validated.

Future input:

- Website URL.
- Target keywords.
- Business type.
- Region or market.
- Competitor URLs, optional.

Future output:

- Technical SEO issues.
- Content gaps.
- Keyword opportunity list.
- Page-level recommendations.
- Summary PDF or structured report.

Possible providers:

- Browserless or Puppeteer for page rendering.
- DeepSeek for broad analysis and low-cost classification.
- Anthropic for final structured report and prioritization.

### 10.3 GEO Tool Future Direction

GEO means generative engine optimization: whether a company, product, or website can be found and recommended by AI assistants such as DeepSeek, Claude, ChatGPT, Perplexity, or similar tools.

Future input:

- Company website.
- Brand name.
- Product/service description.
- Target customer group.
- Important questions customers might ask AI assistants.

Future output:

- Whether the brand appears in AI-generated answers.
- What facts AI systems understand or miss.
- Which content pages should be created.
- Which schema or FAQ content should be added.
- How to improve citation and discoverability.

Design principle:

- Present GEO as a business visibility diagnosis, not as technical jargon.

---

## 11. API And State Design

### 11.1 Lead Submission

Endpoint:

- `POST /api/leads`

Request fields:

- `companyName`
- `contactName`
- `email`
- `phone`
- `interestedPlan`: one of `999`, `2999`, `9999`
- `useCase`
- `notes`
- `source`

Behavior:

- Validate payload.
- Check selected plan exists.
- Create lead.
- Create draft order.
- Send admin notification email.
- Return lead ID.

### 11.2 Admin Approve Order

Endpoint:

- `POST /api/admin/orders/[id]/approve`

Request fields:

- `amountCny`
- `earlyBird`

Behavior:

- Require admin.
- Load order.
- Load plan from pricing.
- Update order final amount and paperwork status.
- Create or reset contract.
- Send Inngest event to generate contract PDF.

### 11.3 Send Contract

Endpoint:

- `POST /api/admin/orders/[id]/send-contract`

Behavior:

- Require admin.
- Verify contract exists.
- Send email to customer.
- Mark paperwork status.

### 11.4 Activate Order

Behavior:

- Require admin.
- Load order and lead.
- Create or match user.
- Grant plan credits.
- Generate invoice PDF.
- Store invoice in R2.
- Update order and lead status.
- Send activation email.
- If new user, send password setup/reset email.

---

## 12. UI Copy Guidelines

Use simple Chinese. Avoid vague AI language.

Good words:

- 诊断
- 工具包
- 增长包
- 陪跑
- 对公打款
- 合同
- 发票
- 交付
- 激活
- credits
- OCR
- SEO
- GEO

Avoid:

- 颠覆
- 革命性
- 一键改变业务
- 全自动替代员工
- 无限使用
- 保证排名
- 保证推荐

Trust copy examples:

- `所有套餐都走对公合同、正规发票，企业财务报销无阻。`
- `提交后我们会在 1 个工作日内审核，审核通过会发邮件给您附上电子合同链接。`
- `月付订阅可随时停用，999 诊断为一次性服务。`
- `上传数据归客户所有，不用于模型训练。`

---

## 13. Visual Design Direction

Style:

- Minimal B2B SaaS.
- White or warm neutral background.
- Dark text.
- One primary accent color.
- Rounded cards.
- Clear borders.
- Spacious layout.
- Avoid gradients unless very subtle.

Components:

- Pricing cards.
- Trust badges.
- Status badges.
- Stepper/progress indicator for order state.
- Form cards.
- Admin data cards.
- PDF preview container.
- Upload dropzone.
- Tool run result panel.

Recommended page layout:

- Container max width around 1100-1200px for marketing.
- Apply form max width around 640px.
- Admin detail max width around 900-1100px.
- Use responsive 3-column pricing cards on desktop and stacked cards on mobile.

---

## 14. Acceptance Criteria

The design is successful when:

- A business owner can understand the difference between 999, 2999, and 9999 within 30 seconds.
- 2999 clearly feels like the main product.
- 999 feels like a low-risk diagnostic entry point.
- 9999 feels like a premium assisted package, not just more credits.
- The apply flow feels professional and safe.
- Contract, invoice, and bank transfer are visible trust signals.
- Admin review flow is obvious and low-friction.
- OCR tool flow makes credit cost, processing state, and result clear.
- SEO / GEO appear as planned tool directions without distracting from OCR Stage 0.

---

## 15. Implementation Notes For app.pontservice

Current source of truth:

- `src/lib/pricing.ts`

Current plan IDs:

- `999`
- `2999`
- `9999`

Current contract templates:

- `src/lib/contracts/templates/consulting-999.md`
- `src/lib/contracts/templates/saas-2999.md`
- `src/lib/contracts/templates/growth-9999.md`

Current important pages:

- `src/app/(marketing)/page.tsx`
- `src/app/(marketing)/pricing/page.tsx`
- `src/app/(marketing)/pricing/apply/page.tsx`
- `src/app/(marketing)/pricing/apply/apply-form.tsx`
- `src/app/admin/leads/[id]/page.tsx`
- `src/app/admin/leads/[id]/approval-panel.tsx`
- `src/app/(app)/orders/[id]/page.tsx`
- `src/app/contracts/[id]/page.tsx`
- `src/app/(app)/tools/ocr-invoice`

Current important APIs:

- `src/app/api/leads/route.ts`
- `src/app/api/admin/orders/[id]/approve/route.ts`
- `src/app/api/admin/orders/[id]/send-contract/route.ts`
- `src/app/api/tools/ocr-invoice/run`
- `src/app/api/tools/ocr-invoice/status`

When implementing future SEO / GEO tools, reuse:

- credits system.
- `tool_runs` table.
- file/storage provider if needed.
- Inngest async execution.
- DeepSeek and Anthropic provider abstraction.
- same result polling pattern as OCR.

---

## 16. Open Questions

Questions to resolve after the first paid order:

- Should 2999 and 9999 stay monthly forever, or should annual prepay be added later?
- Should unused credits expire monthly or roll over for a limited window?
- Should 999 diagnosis credits be enough for 10 OCR runs, or should the trial quota be smaller?
- Should SEO / GEO be separate tools or part of one website diagnosis tool?
- When should the stub e-sign flow be replaced by 法大大 or e签宝?
- When should real SMS provider replace stub SMS?

---

## 17. Stage 0 Final Goal

The Stage 0 product is complete when:

- `pontai.cloud` is online.
- The first customer submits a real application.
- Admin approves and sends contract.
- Customer signs.
- Customer pays by company bank transfer.
- Admin activates account.
- Customer receives invoice.
- Customer logs in and successfully runs OCR.
- Customer gives written feedback that the service is worth the price.
