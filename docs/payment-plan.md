# 支付体系规划

**版本**: 1.0
**日期**: 2026-04-24
**基于**: [ADR-002](adr-002-global-first-mvp.md)

---

## 一、设计原则

### 1.1 客户画像决定支付方式

不同客单价的客户，天然习惯不同的支付路径:

| 客单价 | 客户类型 | 习惯的支付方式 | 财务诉求 |
|-------|---------|------------|---------|
| < ¥200 | C 端零售 | 微信/支付宝链接 | 不需发票 |
| ¥200-2000 | 小 B / 个体 | 微信/支付宝 + 对公均可 | 可要普票 |
| **¥999-3000** | **中小企业** | **对公转账 (主) + 支付宝 (辅)** | **要普票，用于报销** |
| **¥3000-50000** | **中型企业** | **对公转账 + 合同** | **要专票或普票** |
| > ¥50000 | 大企业 | 对公 + 完整合同 + 招投标 | 要专票，走项目流程 |

**你的三档产品定位**:

- ¥999 诊断服务 → 中小企业客单价
- ¥2999 工具包 → 中小企业客单价
- ¥9999 增长陪跑包 → 中型企业客单价

**所有三档都落在"对公转账为主"的区间**，而不是"支付链接为主"。这是 Stage 0 的核心判断。

### 1.2 三条设计原则

1. **B 端大额订单用对公转账**，不是委屈妥协，是专业体现
2. **所有支付能力走 Provider 抽象层**，切换供应商不影响业务代码
3. **发票能力是硬门槛**，没发票不报销，2999 老板就不会买

---

## 二、Stage 0: 对公转账 + 电子合同（现在）

### 2.1 客户体验全流程

```
┌────────────────────────────────────────────────────────────────┐
│ Step 1: 客户发现                                                 │
│ ───────                                                         │
│ 渠道: 微信群 / 朋友推荐 / 案例分享 / 搜索                          │
│ 落地: pontai.cloud 首页                                         │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 2: 了解产品                                                 │
│ ───────                                                         │
│ 浏览: /pricing 三档套餐展示                                       │
│   • ¥999 - 单次诊断（对应 1 次 AI 审计 + 1 小时远程咨询）           │
│   • ¥2999 - 工具包（12 个月使用权 + 2400 credits）                 │
│   • ¥9999 - 增长陪跑包（工具包 + 专项诊断 + 6000 credits）          │
│   • 早鸟价: 前 10 位客户享 2999 → 1999 / 9999 → 6999              │
│ CTA: "立即申请" 按钮                                              │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 3: 提交意向                                                 │
│ ───────                                                         │
│ 页面: /pricing/apply                                            │
│ 表单字段:                                                        │
│   • 公司全称*                                                    │
│   • 联系人姓名*                                                  │
│   • 企业邮箱*                                                    │
│   • 手机号*                                                      │
│   • 意向套餐 (999 / 2999 / 9999 / 组合)                           │
│   • 预期使用场景（文本）                                          │
│   • 备注                                                        │
│ 提交后: 写入 leads 表，Resend 发邮件给 CTO，返回感谢页             │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 4: 人工跟进（24 小时内）                                     │
│ ───────                                                         │
│ 渠道: 邮件 + 微信（如果留了微信）                                  │
│ 内容:                                                            │
│   • 确认需求                                                     │
│   • 发送产品介绍 / 样例                                           │
│   • 回答问题                                                     │
│   • 促成签约意向                                                 │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 5: 发送合同 + 账户信息                                       │
│ ───────                                                         │
│ 工具: e签宝（或法大大）                                           │
│ 合同: 根据套餐选择对应模板                                        │
│   • 《信息化诊断服务协议》 — 999 元                               │
│   • 《AI 工具 SaaS 服务订阅协议》 — 2999 元                       │
│   • 《AI 增长陪跑服务协议》 — 9999 元                              │
│ 附件: 对公账户信息 PDF                                            │
│   • 户名: XX 有限公司                                             │
│   • 开户行: 招商银行 XX 支行                                      │
│   • 账号: 6225 XXXX XXXX XXXX                                   │
│   • 备注建议: "订单号 PONT-YYYYMMDD-XXX / 公司名"                 │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 6: 客户签约 + 打款                                          │
│ ───────                                                         │
│ 客户: e签宝签合同 + 财务对公转账                                   │
│ 到账时间: 一般 T+0 到 T+2                                         │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 7: 确认到账 + 激活                                          │
│ ───────                                                         │
│ CTO 操作:                                                        │
│   1. 对公账户收到款项，核对金额和备注                              │
│   2. 进入 /admin/orders                                         │
│   3. 找到对应 lead，标记 "已付款"                                 │
│   4. 点击 "激活账号" 按钮                                         │
│      → 创建/升级用户账号                                          │
│      → 写入 credit_transactions（reason: "订单 PONT-XXX"）       │
│      → 更新 credit_balances                                     │
│      → 记录合同编号和打款流水号                                    │
│   5. 开具发票（PDF）                                              │
│   6. 发激活邮件 + 发票附件给客户                                   │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 8: 客户登录使用                                              │
│ ───────                                                         │
│ 客户: 收到激活邮件 → 登录 pontai.cloud → 看到 credits → 开始使用    │
└────────────────────────────────────────────────────────────────┘
```

### 2.2 技术实现清单（Stage 0 Week 1）

需要开发:

- [ ] `/pricing` 营销页
- [ ] `/pricing/apply` 意向表单
- [ ] API: `POST /api/leads` 写入 leads 表 + 发邮件
- [ ] `/admin` 后台基础布局
- [ ] `/admin/leads` leads 列表 + 状态管理
- [ ] `/admin/orders` 订单列表 + 手动标记到账
- [ ] `/admin/activate` 激活工具
  - 创建用户（Better Auth）或升级现有用户
  - 写入 credit_transactions + 更新 balance
  - 创建 orders 记录
  - 发激活邮件（Resend）

**不需要开发**（Stage 0 不做）:

- ❌ 在线支付 SDK 集成
- ❌ 支付回调处理
- ❌ 退款接口
- ❌ 自动续费逻辑

### 2.3 数据表设计（Stage 0 必须）

```sql
-- leads 表: 客户意向
create table leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  interested_plan text, -- '999' | '2999' | '9999' | 'combo'
  use_case text,
  notes text,
  source text, -- 'organic' | 'referral' | 'social'
  status text default 'new', -- new | contacted | contract_sent | paid | activated | lost
  assigned_to uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- orders 表: 订单（手工状态机）
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null, -- 'PONT-20260424-001'
  lead_id uuid references leads(id),
  user_id uuid references users(id),
  plan_type text not null, -- '999' | '2999' | '9999'
  amount_cny numeric(10, 2) not null,
  early_bird boolean default false,
  actual_amount_cny numeric(10, 2) not null, -- 实付（早鸟折扣后）
  status text default 'pending', -- pending | contract_sent | paid | activated | refunded | cancelled
  contract_id text, -- e签宝合同 ID
  contract_url text,
  payment_method text, -- 'bank_transfer' | 'wechat_pay' | 'alipay' | 'stripe'
  payment_reference text, -- 打款流水号
  paid_at timestamptz,
  activated_at timestamptz,
  credits_granted integer, -- 本单实际发放的 credits
  invoice_number text,
  invoice_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index orders_status_idx on orders(status);
create index orders_user_idx on orders(user_id);
create index leads_status_idx on leads(status);
```

### 2.4 合同管理

**工具**: e签宝（推荐）或 法大大

**免费额度**: e签宝个人版每月 5 份免费，企业版有试用

**3 份合同模板要点**:

#### 模板 1: 《信息化诊断服务协议》（999 元）

关键条款:
- 服务范围: 1 次 AI 业务审计（线上/线下），1 小时远程咨询会议，1 份诊断报告 PDF 交付
- 交付时间: 合同签署后 7 个工作日内完成
- 退款条款: 咨询会议开始前 48 小时可全退，开始后不退
- 保密: 双方互相保密
- 知识产权: 诊断报告归甲方所有，方法论归乙方所有

#### 模板 2: 《AI 工具 SaaS 服务订阅协议》（2999 元）

关键条款:
- 服务范围: AI 工具包 12 个月使用权，200 credits/月（年度累计 2400 credits）
- 服务期限: 付款激活之日起 12 个月
- Credits 规则: 每月自动发放，当月未用完不累计（鼓励使用）—— **或**年度一次性发放 2400（你选一种）
- 退款条款: 激活 7 天内未使用可全退，已使用后按剩余月份退款（按日计算）
- SLA: 月度可用率 > 99%（Railway + Cloudflare + PostgreSQL 都能做到）
- 数据归属: 客户上传数据归客户所有，90 天后自动清理（除非续费）

#### 模板 3: 《AI 增长陪跑服务协议》（9999 元）

关键条款:
- 服务范围: 工具包 12 个月访问权，6000 credits 一次性到账，含 2 次专项诊断
- 早鸟价: 注明原价 9999，早鸟价 6999（按实际谈判填写）
- 退款条款: 激活 14 天内未使用工具且未开始专项诊断可全退，已开始交付后按剩余期限和已交付内容扣减
- 优先级: 提供优先客服响应（工作日 4 小时内）
- 个性化: 可申请 2 次定制化 Prompt 或工作流调优

**建议**:
- 找个朋友的律师改一版（专业合同 1000-3000 元，一次投入长期用）
- 或者去 e签宝/法大大模板库找"SaaS 服务协议"改编

### 2.5 发票管理

**税务主体**: 选择一家你的有限公司作为收款和开票主体

**发票类型**:
- 小规模纳税人 → 增值税普通发票（3% 税率）
- 一般纳税人 → 增值税专用发票（6% 现代服务税率）

**开票流程**（Stage 0 手工）:
1. 客户到账后，询问开票信息（抬头、税号、地址、开户行 — 普票只需抬头和税号）
2. 用税务局的开票软件开票（具体软件因地区而异）
3. 导出 PDF
4. 邮件发送给客户

**发票抬头示例**:
```
XX 公司                        （单位名称）
91XXXXXXXXXXXXXXXXXX            （统一社会信用代码）
咨询服务费 / 技术服务费            （项目名称）
¥999.00                        （金额）
```

**常见坑**:
- 客户提供的税号写错 → 开错发票作废重开，税务会记录
- 项目名称写错 → 客户报销不过
- 建议 Stage 0 开票前**邮件确认一次**抬头信息

### 2.6 增长包升级逻辑

当前阶段先不公开卖 36000 年付，把高阶 SKU 收敛成更容易成交的 9999 增长包:

| 套餐 | 原价 | 早鸟价 | 折扣 | 客户心智 |
|------|------|---------|-----|---------|
| 999 诊断 | 999 | 999 | 无折扣 | "先看清问题" |
| 2999 工具包 | 2999 | 1999 | 33% 折扣 | "先把工具用起来" |
| 9999 增长包 | 9999 | 6999 | 30% 折扣 | "有人陪跑落地" |

**关键**:
- 早鸟价是"前 10 名限定"，制造稀缺感
- 过了前 10 名恢复原价，老客户续费享老价格
- 9999 不只卖 credits，而是卖"工具 + 诊断 + 工作流调优"

**合同里的文字**:
```
"甲方作为本服务前 10 位签约客户，享受早鸟优惠价: 
 原价¥9,999元 → 早鸟价¥6,999元。
 本价格仅限本合同期内有效，续约恢复届时公开价格（可再次享受老客户续费优惠）。"
```

---

## 三、Stage 1: 加 Stripe（海外自动化）

**触发**: Stage 0 完成 10 单，或海外客户开始自发询问能否信用卡付款

### 3.1 新增能力

- Stripe Checkout（一个 URL 跳转，客户输入卡号完成支付）
- Stripe Subscription（年付/月付自动续费）
- Stripe Invoice（自动生成发票，可含税）
- Stripe Tax（自动处理各国税务，可选）
- Webhook 接收支付成功事件，自动激活

### 3.2 架构

```
[客户在 pontai.cloud/pricing]
       ↓ 点击 "立即支付" (Stripe 路径)
[Stripe Checkout 页面]
       ↓ 客户输入信用卡
[Stripe 后台处理]
       ↓ 支付成功
[Webhook → pontai.cloud/api/stripe/webhook]
       ↓ 验签 + 幂等检查
[写入 payment_events 表]
       ↓ 触发激活 Edge Function
[激活账号 + 发放 credits + 发邮件]
```

### 3.3 什么时候给客户 Stripe 路径？

建议 A/B 两条路径并行:

- 国内公司（看公司名含"有限公司"等）→ 默认推对公转账
- 海外公司 / 个人用户 → 默认推 Stripe
- `/pricing/apply` 表单上同时提供两个按钮: "对公转账（推荐企业客户）" | "信用卡支付"

### 3.4 Stage 1 技术任务

- [ ] Stripe 账号开通（stripe.com，海外公司注册）
- [ ] `/api/stripe/checkout` 创建支付会话
- [ ] `/api/stripe/webhook` 接收支付事件
- [ ] Stripe Products & Prices 配置三档套餐
- [ ] 订阅管理页 `/account/subscription`
- [ ] 退款工具（CTO 在 admin 发起）

---

## 四、Stage 2: 加微信支付 + 支付宝（国内规模化）

**触发**: 国内客户 > 100/月，或开课启动前

### 4.1 前置依赖（20 工作日 lead time）

- [ ] `pontai.com` ICP 备案完成
- [ ] 微信支付商户号开户（7-15 工作日）
- [ ] 支付宝开放平台认证（3-7 工作日）
- [ ] 阿里云 SAE 部署国内版（可放 API 路由）

### 4.2 微信支付集成

**两种模式**:

- **JSAPI**（在微信内打开，扫码/直接支付） — 移动端主力
- **Native**（PC 扫码支付） — PC 用户

**三层保险**（沿用 v2.0 §4.5）:

```
[前端点击支付]
       ↓
[后端调 /wechat/unified-order API]
       ↓ 返回 prepay_id / code_url
[前端唤起微信 JSAPI 或显示二维码]
       ↓
[用户支付成功]
       ↓
[微信推 webhook → /api/wechat/webhook]
       ↓ 验签 + 解密 + 幂等
[写入 payment_events 表 → 返回 200]
       ↓
[Edge Function 异步激活]

+ 兜底 1: 前端 30 秒未收到推送，主动查订单状态
+ 兜底 2: pg_cron 每 5 分钟扫 PENDING 超 10 分钟的订单
```

### 4.3 支付宝集成

**两种模式**:
- **当面付**（扫码支付，PC/移动均可）
- **PC 网站支付**（跳转支付宝登录支付）

架构和微信支付同构，唯一差异是 API 调用格式。

### 4.4 客户体验（Stage 2）

`/pricing/apply` 表单支付方式选择:

```
○ 对公转账 + 发票（推荐企业客户，大额订单首选）
○ 微信支付（个人账户或小额订单）
○ 支付宝支付（个人账户或小额订单）
○ 信用卡（海外客户，Stripe）
```

根据客户类型默认推荐不同方式，但**保留所有选项**。

### 4.5 发票自动化（Stage 2）

Stage 0/1 手工开票能撑到 30-50 单/月。超过这个量要上发票自动化:

选项:
- **百旺/航天信息/诺诺** 第三方开票平台 API 集成
- **税乎** SaaS 开票（无 API）
- **阿里云发票云服务**

---

## 五、Provider 抽象层设计

为保证 Stage 0 → Stage 2 平滑过渡，支付能力必须从一开始就走抽象层:

### 5.1 接口设计

```typescript
// lib/payment/types.ts

export type PaymentProvider = 'bank_transfer' | 'stripe' | 'wechat_pay' | 'alipay'

export interface PaymentIntent {
  orderId: string
  amountCny: number
  provider: PaymentProvider
  metadata: Record<string, unknown>
}

export interface PaymentSession {
  provider: PaymentProvider
  sessionId: string
  // bank_transfer: 无，返回合同 + 账户信息 URL
  // stripe: Checkout URL
  // wechat_pay: prepay_id 或 code_url
  // alipay: form HTML 或 qr_code
  paymentUrl?: string
  qrCode?: string
  expiresAt: Date
}

export interface IPaymentProvider {
  createSession(intent: PaymentIntent): Promise<PaymentSession>
  handleWebhook(rawBody: string, headers: Record<string, string>): Promise<PaymentEvent>
  refund(orderId: string, reason: string): Promise<RefundResult>
}
```

### 5.2 Stage 0 实现

```typescript
// lib/payment/providers/bank-transfer.ts

export class BankTransferProvider implements IPaymentProvider {
  async createSession(intent: PaymentIntent): Promise<PaymentSession> {
    // 返回合同下载 URL + 对公账户信息 URL
    return {
      provider: 'bank_transfer',
      sessionId: intent.orderId,
      paymentUrl: `/orders/${intent.orderId}/contract`,
      expiresAt: addDays(new Date(), 7),
    }
  }

  async handleWebhook() {
    throw new Error('Bank transfer does not have webhooks; use manual activation')
  }

  async refund(orderId: string, reason: string) {
    // 记录退款意图，CTO 手工处理
    return { success: true, requiresManualProcessing: true }
  }
}
```

### 5.3 Stage 1 实现

```typescript
// lib/payment/providers/stripe.ts

export class StripeProvider implements IPaymentProvider {
  async createSession(intent: PaymentIntent): Promise<PaymentSession> {
    const session = await stripe.checkout.sessions.create({
      /* ... */
    })
    return {
      provider: 'stripe',
      sessionId: session.id,
      paymentUrl: session.url!,
      expiresAt: new Date(session.expires_at * 1000),
    }
  }

  async handleWebhook(rawBody: string, headers: Record<string, string>) {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
    /* ... */
  }

  async refund(orderId: string, reason: string) {
    /* ... */
  }
}
```

### 5.4 Stage 2 实现（省略，同构）

`WeChatPayProvider` 和 `AlipayProvider` 实现同一接口。

### 5.5 Provider 路由

```typescript
// lib/payment/index.ts

const providers: Record<PaymentProvider, IPaymentProvider> = {
  bank_transfer: new BankTransferProvider(),
  stripe: new StripeProvider(),          // Stage 1 启用
  wechat_pay: new WeChatPayProvider(),   // Stage 2 启用
  alipay: new AlipayProvider(),          // Stage 2 启用
}

export function getPaymentProvider(type: PaymentProvider): IPaymentProvider {
  const provider = providers[type]
  if (!provider) throw new Error(`Payment provider ${type} not configured`)
  return provider
}
```

**关键**: Stage 0 时只实例化 `BankTransferProvider`，其他保留接口，`payment_method` enum 在 DB 里一开始就全量定义。

---

## 六、Credits 发放规则

每笔订单激活时，固定的 credits 映射:

| 套餐 | Credits | 备注 |
|------|---------|------|
| 999 诊断 | 50 | 够试用 + 生成报告 |
| 2999 工具包 | 200/月 或 2400/年 | 按合同约定 |
| 9999 增长包 | 6000 一次性 | 当年内用完 |
| 早鸟 1999 | 同 2999 | 数量不变，只是价格优惠 |
| 早鸟 6999 | 同 9999 | 数量不变，只是价格优惠 |
| 注册送 | 50 | 不依赖付费 |

**关键规则**:
- Credits 发放必须通过 `credit_transactions` append-only 记录
- `credit_balances` 必须等于所有 transactions 的累加（一致性 CHECK）
- 退款时发反向 transaction（不删原记录）

---

## 七、退款处理

### 7.1 Stage 0 手工流程

1. 客户邮件/微信申请退款
2. CTO 评估是否符合合同条款
3. 同意 → 对公账户转回 → 在 admin 标记 `status = 'refunded'`
4. 发反向 credit_transaction（retreat）
5. 税务: 开红字发票作废原发票

### 7.2 Stage 1/2 自动化

- Stripe: API 调用 `stripe.refunds.create()` 全自动
- 微信支付/支付宝: 调官方退款 API
- 发票: 自动开红字

---

## 八、对账与报表

### 8.1 Stage 0

每月一次人肉对账:
- 对公银行流水 → orders 表 `paid` 状态
- 查漏: 有流水无订单 / 有订单无流水
- 月末写 `monthly-reconciliation-YYYYMM.md` 归档

### 8.2 Stage 1/2

半自动:
- Stripe 每月对账报表自动生成
- 微信支付每日对账单下载
- 写 cron 脚本对账，发报告邮件给 CTO

---

## 九、常见问题预案

### Q1: 客户说"只有微信支付，能不能开一下？"

**Stage 0 回应**: "微信支付的商户号开户审核周期 15 天左右，目前我们支持对公转账和合同签署，这也是大多数企业客户的财务习惯，您看方便吗？"

**如果客户坚持**: 评估订单金额 vs 开微信支付的投入，通常 ¥3000 以下单不值得为此专门开户。

### Q2: 客户说"需要我们开增值税专用发票（专票）"

**现状**:
- 小规模纳税人默认开普票
- 如果客户是一般纳税人要专票，你也需要是一般纳税人才能开

**回应**: "我们目前开具增值税普通发票，税率 3%。如果您单位必须专票，我们可以评估升级为一般纳税人后专门开具（时间约 1-2 周）。"

**判断**: 如果这位客户年度订单 > ¥50000 且明确要专票，值得升级为一般纳税人。

### Q3: 客户说"能不能先付一部分，用得好再付剩下的？"

**回应**: 合同里加"分期条款":
- 签约付 30% 启动款
- 激活首月付 40%
- 激活 3 个月后付 30%

**注意**: 分期只适合 ≥ ¥10000 的客户，小单分期工作量 > 收益。

### Q4: 客户说"我要走招投标流程"

**现状**: Stage 0 不接招投标客户。招投标需要完整的公司资质、ISO 认证、标书响应能力。

**回应**: "我们目前服务中小企业客户，暂不参与招投标。建议您考虑按公司采购流程签订标准服务协议。"

### Q5: 客户说"我想先试一下，试了再付钱"

**回应**: "好的，我们提供 100 credits 的免费试用额度（约相当于 3 次 OCR 处理）。注册后自动发放。试用后满意再签约。"

**操作**: 把 `pontai.cloud` 注册即送 50 credits 临时提升到 100，专门为这类意向客户服务。

---

## 十、相关文档

- [ADR-002: 架构决策](adr-002-global-first-mvp.md)
- [stage-plan.md](stage-plan.md)
- [aliyun-decisions.md](aliyun-decisions.md)

---

## 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2026-04-24 | 初版 |
