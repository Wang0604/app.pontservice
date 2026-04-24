# Stage Plan - 三阶段演进路线

**版本**: 1.0
**日期**: 2026-04-24
**基于**: [ADR-002](adr-002-global-first-mvp.md)
**覆盖**: 从当前到 Month 6+ 的技术 + 商业双轨路线

---

## 总览

| 阶段 | 目标 | 用户规模 | 月度成本 | 关键收款方式 | 主要工作 |
|------|------|---------|---------|------------|---------|
| **Stage 0** | 验证 + 前 10 单 | 0 → 10 付费客户 | < $20 | 对公转账 | 脚手架 + 合同流程 + 第一个工具 |
| **Stage 1** | 海外自动化 + 扩展 | 10 → 100 付费客户 | ~$50 | + Stripe | Stripe 集成 + 工具迭代 |
| **Stage 2** | 国内规模化 + 开课 | 100 → 1000+ | ¥500-800 | + 微信支付 + 支付宝 | 双轨部署 + 备案 + 规模化 |

---

## Stage 0: 海外 MVP + 国内手工收单

**时间窗口**: 现在 - Month 2（约 8 周）
**负责人**: CTO（你）+ 可能的兼职前端
**投资**: 一次性 ¥500-1500（公司注册/电子合同/域名等），月度 < $20

### 0.1 目标（退出 Stage 0 的标准）

- ✅ 产品跑通一个完整的用户旅程（注册 → 免费 credits → 使用 OCR → 付费升级）
- ✅ 完成 **10 个**真实付费订单（含 999 咨询 + 2999 工具包 + 36000 年费任意组合）
- ✅ OCR 工具准确率 > 80%（5 份真实 PDF 验证）
- ✅ 至少 **3 个客户反馈**"值这个价"
- ✅ Provider 抽象层骨架完整，为 Stage 1/2 留好接口

### 0.2 架构（严格继承前 CTO v1.1）

```
┌──────────────────────────────────────────────────┐
│  浏览器（全球用户，海外 + 国内熟人）                    │
└─────────────────────┬────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────┐
│  Cloudflare（全球前置层，免费 Plan）                 │
│  ────────────────────                            │
│  • DNS / 全球 CDN（含国内节点）                      │
│  • WAF / DDoS 防护                                │
│  • 免费 SSL (Let's Encrypt)                      │
└─────────────────────┬────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────┐
│  Railway（Singapore region）                       │
│  ────────────────────                            │
│  Service: web (Next.js 14 App Router)            │
│  • 营销页 /pricing /cases /about                   │
│  • 工具页 /tools/*                                 │
│  • API Routes / Server Actions                    │
│  • Admin 后台 /admin/*                             │
│  • Better Auth session 验证                        │
│  ────────────────────                            │
│  Railway PostgreSQL（同 Region 内网）               │
│  • 7 张核心表 + 自动备份                             │
└──────────────────────────────────────────────────┘

外部服务层（Provider 抽象层后面）:
  • Cloudflare R2    — 文件存储（S3 兼容，零出口流量费）
  • Inngest          — 异步任务 / 定时任务 / Step Functions
  • Resend           — 邮件（免费 3000/月）
  • DeepSeek API     — OCR + LLM（按量）
  • Anthropic Claude — 高质量 LLM（按量）
  • Browserless      — Puppeteer 托管（Stage 0）
  • Railway Logs     — 应用日志（自带，免费）

收款层（Provider 抽象层后面）:
  • 对公银行账户    — B 端大额主力
  • e签宝           — 电子合同
  • 小规模纳税人发票 — 人工开票 PDF
```

### 0.3 技术栈（严格继承 v1.1）

| 层 | 选型 | 月成本 | 理由 |
|----|------|------|------|
| 部署 | **Railway**（Hobby） | $5-10 | v1.1 继承，Docker 长进程，Stage 2 切 SAE 同构 |
| CDN + DNS + WAF | **Cloudflare**（Free） | $0 | v1.1 继承，全球 CDN 含国内节点 |
| 域名 | `pontai.cloud`（已有） | 已付 | 海外不需备案 |
| 框架 | Next.js 14 App Router | - | v1.1 继承 |
| 语言 | TypeScript strict | - | v1.1 继承 |
| UI | Tailwind + Radix Primitives | - | v1.1 继承 |
| 表单 | react-hook-form + zod | - | v1.1 继承 |
| ORM | Drizzle | - | v1.1 继承 |
| 数据库 | **Railway PostgreSQL** | 包含 | v1.1 继承，标准 PG 协议 |
| Auth | **Better Auth** | $0 | v1.1 Lucia 的继任者 |
| 存储 | **Cloudflare R2** | $0 起 | v1.1 继承，零出口流量费 |
| 异步任务 | **Inngest** | $0 Free tier | v1.1 继承，50k steps/月免费 |
| 邮件 | Resend | $0 起 | v1.1 继承，免费 3k/月 |
| Puppeteer | **Browserless**（Stage 0） | - | 稳定后 Stage 1 自建 |
| OCR | DeepSeek | 按量 ~$3-5 | v1.1 继承 |
| LLM | **Anthropic Claude + DeepSeek** | 按量 ~$5-10 | v1.1 原方案，海外直连 |
| 日志 | Railway Logs | $0 | 自带，保留 7 天 |
| 错误监控 | 延后 | $0 | 真出事故再接（Sentry / BetterStack） |
| 产品分析 | 延后 | $0 | 有漏斗分析需求再接（PostHog / Plausible） |
| **合计** | | **~$15/月** | |

**说明**: Railway Hobby 基础 $5，含小额 PostgreSQL；Inngest 免费 tier 50k steps/月对 MVP 足够；OCR/LLM 按实际调用量。

### 0.4 收款流程（Stage 0 核心）

```
[客户咨询]（微信/朋友推荐/社群）
       ↓
[pontai.cloud/pricing]
  展示 ¥999 / ¥2999 / ¥36000 年付套餐
       ↓
[点击"立即咨询" → /pricing/apply]
  表单：公司名 + 联系人 + 企业邮箱 + 电话 + 需求
       ↓
[Resend 自动发邮件通知 CTO]
       ↓
[人工跟进]
  微信/邮件联系 → 发合同（e签宝）+ 对公账户信息
       ↓
[客户签合同 + 对公转账]
       ↓
[CTO 在 /admin 手动激活]
  → 创建/升级账号
  → 写入 credits（999=50 / 2999=200 / 36000=2400）
  → 记录订单号 + 合同编号
  → 发激活邮件 + 发票 PDF
       ↓
[客户登录开始使用]
```

**为什么这个流程合适 Stage 0**:

1. 零依赖外部支付 SDK（无需微信商户号/ICP 备案）
2. B 端 999+ 订单客户天然接受对公转账（企业报销需要）
3. 合同是法律保障，零风险
4. 发票是企业报销必需，个人支付链接做不到
5. 单笔上限无限制（36000 元微信个人支付单日限额 2000）
6. CTO 手工处理 10 单内完全 OK（人力成本 << 省下的开发时间）

详细设计见 [payment-plan.md](payment-plan.md)。

### 0.5 Stage 0 任务分解

#### Week 1: 基础设施 + 收款闭环

**Day 1（今天）**:
- [ ] 注册 Railway / Cloudflare / Inngest / Resend / DeepSeek / Anthropic 账号
- [ ] 创建 GitHub 仓库，建 Next.js 脚手架
- [ ] Railway 项目创建（Singapore region）+ PostgreSQL plugin
- [ ] Cloudflare 添加 `pontai.cloud` 域名 + DNS 指向 Railway
- [ ] R2 bucket 创建 + API token
- [ ] Dockerfile + railway.toml 定稿

**Day 2**:
- [ ] Drizzle + Railway PostgreSQL 连接
- [ ] 7 张核心表 schema 一次建全:
  - `users`（Better Auth 扩展）
  - `credit_balances`
  - `credit_transactions`（append-only）
  - `tool_runs`
  - `files`
  - `leads`（Stage 0 收客户咨询）
  - `orders`（Stage 0 用对公转账 + 人工状态机）
- [ ] 首次迁移 + seed 数据

**Day 3**:
- [ ] Better Auth 集成（邮箱 OTP via Resend）
- [ ] 登录页跑通
- [ ] Credits 系统（注册送 50 / 余额 / 流水）

**Day 4**:
- [ ] `/pricing` 营销页（999 / 2999 / 36000 三档）
- [ ] `/pricing/apply` 咨询表单
- [ ] 写入 `leads` 表 + 邮件通知 CTO

**Day 5**:
- [ ] Admin 后台简陋版 `/admin`
- [ ] `/admin/leads` 客户咨询列表 + 状态管理
- [ ] `/admin/activate` 手动激活工具
- [ ] e签宝账号 + 3 份合同模板定稿

**Week 1 出口**: 能收到咨询 → 人工联系 → 签合同 → 对公转账 → 手动激活 → 客户登录能看到 credits

#### Week 2-3: 第一个工具 OCR（M1 压缩到 2 周）

**Week 2**:
- [ ] Provider 抽象层骨架（interface/payment/sms/email/llm/ocr/storage/auth）
- [ ] `/tools/ocr-invoice` UI
- [ ] 文件上传（R2 + Presigned URL）
- [ ] DeepSeek OCR Provider 实现
- [ ] Inngest function: OCR 任务执行（step functions + 重试）
- [ ] Anthropic Claude 后处理（结构化输出）
- [ ] 前端轮询任务状态（或 Inngest realtime 推送）

**Week 3**:
- [ ] 5 份真实 PDF 跑通测试
- [ ] 准确率调优到 > 80%
- [ ] 失败处理 + credits 退回
- [ ] Prompt 版本化（`prompts/ocr-invoice-v1.md`）
- [ ] 结果展示页（结构化表格）

**Week 2-3 出口**: 第一个老板（现有意愿客户）能用 2999 工具包跑出真实价值

#### Week 4-8: 完善 + 拿下前 10 单

- [ ] `/cases` 案例库（基于前几个客户反馈整理）
- [ ] 邀请制白名单（inviteCode 字段）
- [ ] 年付优惠逻辑（`orders.plan_type = 'annual'`）
- [ ] 客户自助看订单 + credits 流水
- [ ] 顾问后台：标记交付 + 上传 PDF
- [ ] 销售话术/合同模板迭代（跟进前 3 单的实际反馈）

**Stage 0 退出**:
- 10 个真实付费订单
- 至少 2 个续费或加购
- OCR 准确率稳定 > 80%
- 客户 NPS > 7（主观）

### 0.6 Stage 0 潜在风险

| 风险 | 概率 | 缓解 |
|------|------|------|
| Railway Singapore 对国内访问慢 | 中 | Cloudflare 前置 CDN + 静态资源 edge cache |
| Inngest 跨境（美国）延迟略高 | 低 | MVP 任务量 < 1 万/月可接受，Stage 2 再评估 |
| Railway PostgreSQL 免费额度不够 | 低 | 超过 80% 容量升级 Pro（$10-20/月） |
| R2 国内访问偶尔慢 | 低 | Cloudflare CDN 就近分发 |
| Better Auth 项目风险 | 低 | 活跃维护，数据可导出，备选 Auth.js |
| DeepSeek API 稳定性 | 中 | Provider 抽象层降级到 Anthropic / 百度 OCR |
| 个别老板需要微信支付（不接受对公） | 低 | 先沟通，不行就放弃这单，不为 1 单建整套 |
| CTO 精力不够兼顾销售+开发 | 高 | 限制同时在跟进的 leads < 5 |
| 合同纠纷 | 低 | 使用标准模板 + 退款条款明确 |

---

## Stage 1: 海外自动化 + 扩展到前 100 单

**触发条件**: 满足以下任一
- Stage 0 已完成 10 单，验证通过
- 对公转账手工流程压力 > 20 单/月
- 有第一批主动找上门的海外客户

**时间窗口**: Month 2-3
**目标**: 前 100 单，月度自动化收款占比 > 50%

### 1.1 新增能力

#### 能力 1: Stripe 支付（海外信用卡）

- Stripe Checkout 集成（不需要做 PCI 合规）
- 订阅管理（月付 / 年付自动续费）
- 自动开票（Stripe Tax + 邮件发送）
- 对 999/2999/36000 三档套餐提供 Stripe Price
- 国内客户继续走对公转账

#### 能力 2: Railway PostgreSQL 升级（按需）

**触发时机**: DB 超过基础容量，或需要更频繁的备份

- Railway Pro 按量，一般月度 $10-20 够 Stage 1 规模
- 连接数增加
- 更快的磁盘 IO

#### 能力 3: 自建 Puppeteer Service

Stage 0 用 Browserless ($30/月起)，Stage 1 如果调用量大成本倒挂，或对控制力有需求，切换为自建:

- Railway 新建 service `puppeteer-worker`
- Express + puppeteer-core（Alpine base image）
- 每次抓取后关闭 page
- 每 1000 请求或 24h 重启浏览器
- web 和 puppeteer-worker 之间走 Railway 内网 DNS

#### 能力 4: 第二个工具（SEO 诊断）

- `/tools/seo-audit`
- 调 puppeteer-worker（自建）或 Browserless（托管）
- 技术 SEO 检测 + Anthropic Claude 评估
- PDF 报告导出（用 `@react-pdf/renderer`）

#### 能力 5: 自动化运营

- 新用户欢迎邮件流（Resend Automations 或 Loops）
- Credits 低余额提醒（Inngest Cron）
- 年付即将到期提醒（Inngest Cron）

### 1.2 新增月度成本

| 项目 | 成本 |
|------|------|
| Railway Pro / 升级 | +$10-20 |
| Stripe 手续费 | 2.9% + $0.30 /单（只对走 Stripe 的单子） |
| Browserless（Stage 1 早期）或自建 Puppeteer | $30 / 或 Railway 额外 service $5-10 |
| Resend Pro（如果超 3k/月） | $20 |
| Inngest Pro（如果超 50k steps/月） | $20 |
| **合计** | **~$75-100/月**（不含 Stripe 按量手续费） |

### 1.3 Stage 1 退出

- 100 个付费订单
- 月度自动化收款占比 > 50%
- 至少 2 个工具上线且月活 > 30
- 开始有海外客户主动推荐（NPS > 8）

---

## Stage 2: 国内规模化 + 开课启动

**触发条件**: 满足以下任一
- 国内付费客户 > 100/月
- 准备发布首期课程
- 有明确的线下活动/渠道需要国内域名承接

**时间窗口**: Month 3+
**目标**: 月单量 300+，2999 升级率 > 15%，开课转化漏斗建立

### 2.1 双轨架构启动

```
                        ┌─────────────────┐
                        │   用户浏览器      │
                        └────────┬────────┘
                                 │
                   ┌─────────────┴─────────────┐
                   │                            │
     ┌─────────────▼──────────┐    ┌──────────▼──────────────┐
     │  pontai.cloud         │    │  pontai.com            │
     │  （海外域名）           │    │  （国内域名，已 ICP 备案）  │
     │  Cloudflare            │    │  阿里云 CDN + WAF        │
     └─────────────┬──────────┘    └──────────┬──────────────┘
                   │                            │
     ┌─────────────▼──────────┐    ┌──────────▼──────────────┐
     │  Railway               │    │  阿里云 SAE             │
     │  同一份 Next.js 代码    │    │  同一份 Next.js 代码     │
     │  (Docker 镜像一致)     │    │  (Docker 镜像一致)     │
     └─────────────┬──────────┘    └──────────┬──────────────┘
                   │                            │
     ┌─────────────▼──────────┐    ┌──────────▼──────────────┐
     │  Railway PostgreSQL    │    │  阿里云 AnalyticDB       │
     │  (Singapore)           │    │  Supabase (上海)        │
     │  └─ 海外用户数据         │    │  └─ 国内用户数据         │
     └────────────────────────┘    └────────────────────────┘
     
     ┌────────────────────────┐    ┌────────────────────────┐
     │  Cloudflare R2         │    │  阿里云 OSS             │
     │  └─ 海外用户文件         │    │  └─ 国内用户文件         │
     └────────────────────────┘    └────────────────────────┘
```

**关键优势**: 因为 Railway 和阿里云 SAE **都是 Docker 容器**，同一份 Dockerfile 就能部署到两边，代码零修改。

**关键设计**:
- 数据分区（海外用户 / 国内用户）按主域名归属
- Provider 抽象层根据 `NEXT_PUBLIC_REGION` 环境变量路由
- Schema 完全一致，Drizzle 迁移双向执行
- 跨区数据迁移工具（如需要）独立写

### 2.2 启动前置（必须提前 20 工作日启动）

- [ ] 购买 `pontai.com`（或 `.cn`）域名
- [ ] ICP 备案（20 工作日）
- [ ] 阿里云企业实名认证（1-3 工作日）
- [ ] 开通 AnalyticDB Supabase 实例（上海）
- [ ] 开通阿里云 SAE
- [ ] 开通阿里云短信（签名 + 模板审批 3 工作日）
- [ ] 开通阿里云邮件推送 DM
- [ ] 微信支付商户号申请（7-15 工作日）
- [ ] 支付宝开放平台开户

### 2.3 支付体系完善

- 微信支付 JSAPI + Native（v2.0 §4.5 三层保险方案）
- 支付宝当面付 + PC Web 支付
- 对公转账保留（大 B 客户仍然主力）
- 客户自助查单、开票、退款

详见 [payment-plan.md](payment-plan.md) 的 Stage 2 部分。

### 2.4 课程与规模化

- 课程售卖页 `/courses`
- 开课落地页 + 支付整合
- 社群引流（加企业微信）
- 内容 CMS（MDX-based）
- 转化漏斗埋点

### 2.5 新增月度成本

| 项目 | 成本 |
|------|------|
| 阿里云 AnalyticDB Supabase | ¥300-500 |
| 阿里云 SAE | ¥200+ |
| 阿里云 CDN + WAF | ¥50-100 |
| 阿里云短信 | 按量 ~¥50 |
| 阿里云邮件 DM | 按量 ~¥20 |
| 微信支付 | 手续费 0.6% |
| 支付宝 | 手续费 0.6% |
| ICP 备案 | ¥0（免费，但有时间成本） |
| **合计** | **¥600-900/月**（新增阿里云部分，海外部分延续 Stage 1） |

### 2.6 Stage 2 退出

- 月单量稳定 > 300
- 2999 升级率 > 15%
- 首期课程完成（≥ 1 期 ≥ 20 学员）
- 企业客户占比 > 50%

---

## 跨阶段不变的事

以下事项不管在哪个阶段都必须做，不因阶段变化而变化:

### 数据安全
- 所有密码/Key 通过环境变量
- PostgreSQL 行级权限（RLS）在 Stage 0 就启用（通过 Drizzle + pg policy）
- 敏感操作审计日志（credits 调整 / 订单状态变更）

### 合规
- 收集用户数据时明确用途
- 用户可导出自己的数据（GDPR 友好）
- 支付数据永不触碰（都由 Stripe/微信/支付宝处理）

### 客户关系
- 每个付费客户手动回访一次（Stage 0 必做，Stage 1/2 可选）
- 合同归档 3 年起
- 发票归档 10 年（税务要求）

### 代码质量
- TypeScript strict
- ESLint + Prettier
- Prompt 版本化（不内嵌在代码里）
- 关键业务流程有集成测试

---

## Stage 切换的"危险瞬间"

每次 Stage 切换都是风险高峰，以下是必须做的事:

### Stage 0 → Stage 1 切换
- [ ] 对公转账流水和 Stripe 流水对账脚本
- [ ] 客户通知（对公依然可用，Stripe 是可选方案）
- [ ] 老合同保留访问权限

### Stage 1 → Stage 2 切换
- [ ] 国内用户数据迁移策略（从 Railway PG 新加坡 → AnalyticDB Supabase 上海）
- [ ] Better Auth 用户数据迁移到 Supabase Auth（阿里云版）
- [ ] 双域名 SEO 策略（canonical / hreflang）
- [ ] 客户认证跨域统一（同一邮箱两边都能登录）
- [ ] 发票连续编号规则（避免税务问题）

---

## 附录: 快速决策表

"我现在遇到 XX 情况，该做什么？"

| 情况 | 动作 |
|------|------|
| 收到第一笔 2999 | Stage 0 流程，对公转账 + 合同 + 发票 |
| 收到第一笔 36000 年付 | 同上，合同写清年付优惠条款 |
| 海外客户想用信用卡付 | 说"暂时只接受对公转账"，Stage 1 再接 Stripe |
| 某个老板坚持微信支付 | 先沟通对公为什么更专业，不行就算了，不为单点需求开全渠道 |
| Railway PG 80% 了 | 立刻升级，这是 Stage 1 触发点 |
| 月单量稳定 > 20 | 开始规划 Stage 1 切换 |
| 准备发开课公告 | 立刻启动 Stage 2（20 工作日 ICP 备案倒推） |
| 有人想代理分销 | Stage 2+ 再谈，先把单子做扎实 |

---

## 相关文档

- [ADR-002: 决策记录](adr-002-global-first-mvp.md)
- [aliyun-decisions.md](aliyun-decisions.md) - 阿里云事项清单
- [payment-plan.md](payment-plan.md) - 支付体系规划
- [roadmap.md](roadmap.md) - 开发路线图
- [checklist.md](checklist.md) - 前置准备清单
