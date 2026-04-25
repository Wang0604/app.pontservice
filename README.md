# Pontai 工具矩阵 - 技术架构文档

> **版本**: 3.1 (Railway + Cloudflare Stage 0，收款流程三步闭环版)
> **日期**: 2026-04-24
> **状态**: 当前生效，是 v1.1 前 CTO 方案的延续 + ADR-002 Stage 0 调整
> **决策依据**: [ADR-002](docs/adr-002-global-first-mvp.md)
> **上一版备份**: [docs/README-v3.0-backup.md](docs/README-v3.0-backup.md)

---

## 本文档如何使用

这是**当前生效的技术架构文档**，作为 Stage 0 造代码时的执行参考。按以下顺序阅读:

1. 本文档（§一 到 §十） — 架构总览
2. [`docs/stage-plan.md`](docs/stage-plan.md) — 三阶段演进路线
3. [`docs/payment-plan.md`](docs/payment-plan.md) — 支付体系
4. [`docs/roadmap.md`](docs/roadmap.md) — 开发路线（Week 级粒度）
5. [`docs/checklist.md`](docs/checklist.md) — 启动前置清单

**历史文档**（归档参考）:
- [`docs/adr-001-supabase-alibaba.md`](docs/adr-001-supabase-alibaba.md) — v2.0 阿里云方案的决策依据
- [`docs/adr-002-global-first-mvp.md`](docs/adr-002-global-first-mvp.md) — 从 v2.0 切回 Railway 的决策依据
- [`docs/stage-2-aliyun-blueprint.md`](docs/stage-2-aliyun-blueprint.md) — v2.0 阿里云方案（Stage 2 恢复时的蓝图）
- [`docs/aliyun-decisions.md`](docs/aliyun-decisions.md) — 阿里云相关事项的归档管理

---

## 一、核心决策

### 1.1 架构演进脉络

| 版本 | 方案 | 决策原因 | 当前状态 |
|------|------|---------|--------|
| v1.0 | Vercel + Supabase + Inngest | 图省事 | 被 v1.1 否决 |
| **v1.1** | **Railway + Cloudflare + Inngest** | **Vercel 不适合 Next.js 长进程** | **被本文档继承** |
| v2.0 | 阿里云 SAE + Supabase 全家桶 | 国内合规 | 归档为 Stage 2 蓝图 |
| **v3.0** | **v1.1 + Stage 0 海外优先调整** | **客户画像澄清为海外+国内点状** | **当前生效** |

### 1.2 为什么严格继承 v1.1 方案

前 CTO 在 v1.1 定下的三条原则，本 CTO 继承:

1. **能用 Postgres 解决的不引入新组件**
2. **能用托管服务的不自建**
3. **能延后的复杂度全部延后**

v1.1 在工具选型上的判断依然成立:

- Vercel Serverless 不适合 Next.js 长进程 → Railway 长进程 + Docker 原生
- 文件存储需要全球 CDN + 低出口流量费 → Cloudflare R2
- 异步任务需要重试/退避/定时 → Inngest（step functions / cron）
- 全球 CDN + DNS + WAF 统一管理 → Cloudflare 前置层
- 邮件送达率 + DX → Resend
- 监控延后 → 需要再接入（Stage 0 只留 Railway Logs）

### 1.3 v3.0 相对于 v1.1 的唯一改动

- **Auth 从 Lucia 切到 Better Auth**: Lucia 在 2025 年已停止维护，Better Auth 是继任者，API 思路相同
- **其他所有选型全部保留 v1.1**

---

## 二、整体架构图

```
┌──────────────────────────────────────────────────────────────────┐
│                  浏览器（全球，主要海外 + 国内熟人）                   │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  Cloudflare（全球前置层）                                           │
│  ─────────────────────────────                                    │
│  • DNS 管理（pontai.cloud）                                         │
│  • 全球 CDN（含国内节点）                                            │
│  • WAF + DDoS 防护                                                 │
│  • TLS 终止 + 免费 SSL                                              │
│  • Page Rules / Cache 策略                                         │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  Railway（Singapore region，离亚洲近）                               │
│  ─────────────────────────────                                    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Service: web (Next.js on Railway)                          │    │
│  │  • SSR/SSG 营销页 + 工具页                                   │    │
│  │  • Server Actions / API Routes                              │    │
│  │  • Healthcheck /api/health                                  │    │
│  │  • Better Auth session 验证                                  │    │
│  └────────────────────┬─────────────────────────────────────┘    │
│                       │                                          │
│                       ▼ (内网 DNS)                               │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Service: puppeteer-worker（Stage 1 启用，Stage 0 用 Browserless） │
│  │  • Express + puppeteer-core                                │    │
│  │  • 每次抓取后关闭 page                                      │    │
│  │  • 每 1000 请求或 24h 重启浏览器                             │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Railway PostgreSQL（托管，同 Region）                       │    │
│  │  • 7 张核心表                                               │    │
│  │  • 自动备份                                                 │    │
│  │  • 连接池（pgBouncer）                                      │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

        ┌────────────────────────┼──────────────────────────────┐
        ▼                        ▼                              ▼
┌──────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  Cloudflare R2   │  │  Inngest             │  │  AI Provider         │
│  • S3 兼容        │  │  • OCR/SEO 异步任务    │  │  • DeepSeek OCR      │
│  • 零出口流量费    │  │  • 定时任务（扫超时）    │  │  • DeepSeek Chat     │
│  • Presigned URL │  │  • Step Functions    │  │  • Anthropic Claude  │
│  • 30 天自动清理   │  │  • 重试/退避/幂等      │  │  • 百度 OCR（兜底）    │
└──────────────────┘  └──────────────────────┘  └──────────────────────┘

        ┌────────────────────────┼──────────────────────────────┐
        ▼                        ▼                              ▼
┌──────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  Resend          │  │  Railway Logs        │  │  Stripe (Stage 1)    │
│  • 事务邮件       │  │  • 运行日志           │  │  • 海外信用卡支付      │
│  • 营销邮件       │  │  • 7 天保留          │  │  • 订阅管理           │
│  • 发票 PDF 附件  │  │                      │  │  • 自动发票           │
└──────────────────┘  └──────────────────────┘  └──────────────────────┘
```

---

## 三、技术栈决策表

### 3.1 应用层

| 维度 | 选型 | 说明 |
|------|------|------|
| Web 框架 | Next.js 14+ (App Router) | v1.1 继承 |
| 部署 | **Railway** | v1.1 继承，Docker 长进程，Stage 2 切 SAE 同构 |
| 语言 | TypeScript (strict) | v1.1 继承 |
| UI | Tailwind + Radix Primitives | v1.1 继承 |
| 表单 | react-hook-form + zod | v1.1 继承 |
| 数据获取 | Server Actions + RSC | v1.1 继承 |

### 3.2 持久层

| 维度 | 选型 | 说明 |
|------|------|------|
| 数据库 | **Railway PostgreSQL** | v1.1 继承，标准 PG 协议，Stage 2 迁阿里云 AnalyticDB Supabase |
| ORM | Drizzle | v1.1 继承，只用标准 PG 语法 |
| 文件存储 | **Cloudflare R2** | v1.1 继承，S3 兼容，Stage 2 迁阿里云 OSS 无痛 |
| 缓存 | MVP 不开，必要时 Upstash Redis | v1.1 的 Tair 等价物 |

### 3.3 认证层

| 维度 | 选型 | 说明 |
|------|------|------|
| 认证核心 | **Better Auth** | v1.1 Lucia 的继任者 |
| 登录方式 | 邮箱 OTP | Better Auth emailOTP 插件 |
| 短信通道 | Stage 0 不用（没短信需求） | Stage 2 加阿里云短信（国内用户） |
| Session | Cookie-based（HttpOnly + Secure）| Better Auth 默认 |

### 3.4 异步任务

| 维度 | 选型 | 说明 |
|------|------|------|
| 任务队列 | **Inngest** | v1.1 继承，Step Functions / 重试 / 退避 / 幂等原生支持 |
| 定时任务 | **Inngest Cron** | v1.1 继承，替代 pg_cron |
| Webhook 处理 | Inngest Handler | 异步处理支付/邮件回调 |

### 3.5 AI 与外部服务

| 维度 | 选型 | 说明 |
|------|------|------|
| OCR | DeepSeek OCR | v1.1 继承 |
| OCR 兜底 | 百度 OCR | v1.1 继承 |
| LLM | **Anthropic Claude + DeepSeek Chat** | v1.1 原方案，海外直连 |
| 网页抓取 | **Browserless (Stage 0) / 自建 Puppeteer (Stage 1)** | Stage 1 再上独立 service |
| Provider 抽象 | 自写薄抽象层 | v1.1 继承 |

### 3.6 收款与通知

#### Stage 0 收款流程（当前，三步闭环）

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  1. 定价展示   │  →   │  2. 建立合同   │  →   │  3. 对公打款   │
│    pricing    │      │   contract   │      │   payment    │
└──────────────┘      └──────────────┘      └──────────────┘
       │                     │                      │
       ▼                     ▼                      ▼
 /pricing 页面        e签宝电子合同         对公银行账户
/pricing/apply      3 份模板：999 一次性   小规模 3% 普票
 → leads 表          / 2999 月付 /         Admin 手动激活
                     9999 月付
```

**Stage 0 明确不做**: 微信支付 / 支付宝 / Stripe / 任何 webhook 自动激活。

| 维度 | Stage 0 选型 | 说明 |
|------|------------|------|
| 1. 定价展示 | `/pricing` + `/pricing/apply` | 三档套餐（999 一次性 / 2999 月 / 9999 月）+ 意向表单 |
| 2. 合同签署 | **e签宝 / 法大大** | 3 份模板（999 诊断 / 2999 工具包 / 9999 增长包） |
| 3. 收款方式 | **对公银行转账** | 客户财务走对公流程，合规合法 |
| 发票 | 小规模纳税人 3% 普票 | 人工开票 PDF，Resend 邮件发送 |
| 激活 | `/admin/activate` 手动 | 对账 → 写 credits → 发激活邮件 |
| 邮件通道 | **Resend** | v1.1 继承，激活/发票/欢迎 |
| 短信通道 | Stage 0 不用 | Stage 2 加阿里云短信（国内） |

#### 支付自动化（Stage 1/2 后置）

以下能力明确**后置**，不在 Stage 0 做:

| 阶段 | 新增支付能力 | 触发条件 | 归档详解 |
|------|------------|---------|---------|
| **Stage 1** | Stripe（海外信用卡 + 订阅） | 海外客户主动要求，Stage 0 完成 10 单 | [payment-plan.md §3](docs/payment-plan.md) |
| **Stage 2** | 微信支付 v3 + 支付宝当面付 | 国内客户 > 100/月 或开课规模化 | [payment-plan.md §4](docs/payment-plan.md) + [stage-2-aliyun-blueprint.md §4.5](docs/stage-2-aliyun-blueprint.md) |

**为什么后置**:
1. B 端 999-9999 元订单客户财务天然走对公，支付链接反而不专业
2. 微信支付商户号需要 ICP 备案 + 7-15 天审核，阻塞上线
3. Stripe 需要海外实体账户，Stage 0 前 10 单不值得建
4. Provider 抽象层已经预留接口，Stage 1/2 加实现不动业务代码

### 3.7 监控与分析

| 维度 | 选型 | 说明 |
|------|------|------|
| 应用日志 | Railway Logs | 保留 7 天 |
| Uptime | UptimeRobot（免费，可选）| 5 分钟粒度 |
| 错误监控 | 延后 | Stage 0 不做，遇到真实问题再评估（Sentry / BetterStack / Axiom 任选） |
| 产品分析 | 延后 | Stage 0 不做，真到需要漏斗分析时再接（PostHog / Plausible 任选） |

---

## 四、关键架构决策

### 4.1 为什么 Railway 而不是 Vercel/SAE/Fly.io

| 方案 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| Vercel | 零配置、全球 Edge | Serverless 长进程限制、超时 60s、按量失控 | ❌ v1.0 已否决 |
| 阿里云 SAE | 国内机房、Stage 2 目标 | 海外访问慢、需 ICP 备案 | ❌ Stage 2 再用 |
| Fly.io | 多 region（含东京/香港）| 运维复杂度稍高 | 🟡 备选 |
| **Railway** | **Docker 长进程 + PG 托管一体 + 可预测成本** | Singapore 单机房 | ✅ **选定（v1.1 继承）** |

**关键**: Railway 和 Stage 2 目标阿里云 SAE **都是 Docker 容器**，迁移时 Dockerfile 不变，只换部署平台。

### 4.2 为什么 Inngest 而不是 Edge Functions / pg-boss / BullMQ

v1.1 原论据依然成立:

- **Inngest**: Step Functions 支持断点续跑、重试、退避、幂等、定时，开发者体验最好
- Edge Functions（Supabase）: 没有 step functions，重试/退避要手写，超时 150s
- pg-boss: 拖慢 PG，MVP 阶段增加数据库压力
- BullMQ / Bee-Queue: 需要 Redis，增加组件

**Stage 0 任务量 < 1 万/月**，Inngest 免费 tier（50k steps/月）完全够用。

### 4.3 为什么 Cloudflare R2 而不是 Supabase Storage / S3

v1.1 的判断:

- **R2**: 零出口流量费（核心优势），S3 兼容 API，全球 CDN 自带
- Supabase Storage: 出口流量费贵（虽然 S3 兼容）
- AWS S3: 出口流量费贵，CDN 要另配
- 阿里云 OSS: Stage 2 国内用，Stage 0 海外不用

### 4.4 为什么 Better Auth 而不是 Supabase Auth / NextAuth / Clerk

- **Better Auth**: Lucia 继任者，轻量、TypeScript 原生、自托管、PG-native
- Supabase Auth: 和 Supabase 绑定，不用 Supabase 时引入重依赖
- NextAuth / Auth.js: 历史包袱多，DX 不好
- Clerk: 重、贵、锁定

### 4.5 文件上传 Presigned URL 模式（v1.1 继承）

```
[浏览器] → [POST /api/upload/intent] → [web] → [R2 API 签发 Presigned PUT URL]
                                          ↓
[浏览器] ← [Presigned URL + file key] ←──┘
   │
   │ 直接 PUT 到 R2（不经过 web 服务器）
   ↓
[上传完成] → [POST /api/upload/confirm (file key)] → [web]
                                                      ↓
                                                 [触发 Inngest job]
```

**关键规则**:
- 所有读取也走 Presigned URL（10 分钟过期）
- R2 Bucket 生命周期策略：30 天自动删除
- 文件元数据（r2_key, size, mime_type）存 PostgreSQL `files` 表

### 4.6 认证流程（Better Auth）

```
[用户输入邮箱]
   ↓
[Better Auth 生成 6 位 OTP]
   ↓
[Resend 发送邮件]
   ↓
[用户输入 OTP]
   ↓
[Better Auth 验证 + 签发 session cookie]
   ↓
[后续请求自动带 Cookie]
```

**防滥用**:
- 同邮箱 1 小时最多 5 条 OTP
- OTP 10 分钟过期
- 输错 5 次锁定该 OTP
- 建议启用 Cloudflare Turnstile 做人机校验

### 4.7 收款流程（Stage 0 对公流程）

**Stage 0 不涉及任何自动化支付**，整个收款链路是：

```
[客户查看 /pricing 三档套餐]
        ↓
[客户填 /pricing/apply 意向表单]
        ↓
[leads 表写入 + Resend 邮件通知 CTO]
        ↓
[CTO 微信/邮件跟进 → 发 e签宝合同 + 对公账户信息]
        ↓
[客户签合同 + 对公转账]
        ↓
[CTO 在 /admin/activate 手动激活账号]
  - 写 credit_transactions（append-only）
  - 更新 credit_balances（CHECK: >= 0）
  - 记录订单号 + 合同编号 + 打款流水号
        ↓
[Resend 发激活邮件 + 发票 PDF]
        ↓
[客户登录使用，credits 可见]
```

**数据表参与**:
- `leads` — 意向客户
- `orders` — 订单主表（支持所有支付方式）
- `credit_transactions` / `credit_balances` — credits 流水与余额

**payment_events 表 Stage 0 建但不用** — 为 Stage 1/2 的 Stripe / 微信 / 支付宝 webhook 预留。

### 4.8 支付自动化三层保险（Stage 1+ 启用，本章先存档）

> ⚠️ **Stage 0 本章不实现**。Stage 1 接入 Stripe / Stage 2 接入微信支付和支付宝时启用。
> 详细设计见 [payment-plan.md §3-4](docs/payment-plan.md)。

核心理念（沿用 v1.1 + v2.0 方案）:
- **第一层**: API Route 接收 webhook，验签 + 幂等写入 `payment_events`，立即返回 200
- **第二层**: Inngest function 异步处理业务（激活账号、发 credits、发邮件），用 event_id 去重
- **第三层**: Inngest Cron 每 5 分钟扫 PENDING 超 10 分钟订单 + 前端支付页主动查单兜底

Stage 2 阿里云部署时，微信支付/支付宝的三层保险按同样模式实现（见 [stage-2-aliyun-blueprint.md §4.5](docs/stage-2-aliyun-blueprint.md)）。

### 4.9 Credits 扣费事务（v1.1 不变）

3 张表严格流水模型:

- `credit_balances`: 当前余额（事实来源）
- `credit_transactions`: 流水（append-only）
- `tool_runs`: 工具调用记录

**核心规则**:
1. `balance` 永远 = `transactions` 累加
2. 修改 `balance` 必须事务 + 行锁（`SELECT ... FOR UPDATE`）
3. `transactions` 绝不允许 UPDATE/DELETE（通过 RLS + trigger 强制）
4. 加 CHECK constraint: `available_credits >= 0`

### 4.10 失败处理与退款（Inngest Step Functions 原生支持）

```
[用户触发工具调用]
        ↓
[Step 1: 预扣 credits] ← PG 事务 + 行锁
        ↓
[Step 2: 入库 tool_runs (status=pending)]
        ↓
[Step 3: inngest.send("tool-run.created", { run_id })]
        ↓
─────────────── Inngest Handler ───────────────
        ↓
[Step A: 调 OCR Provider]  ← 失败自动重试 3 次，退避 10s/30s/1m
        ↓
[Step B: 调 LLM 后处理]    ← 同上
        ↓
[Step C: 写结果到 DB]
        ↓
[Step D: 若任一 Step 最终失败]
   ├─ 退 credits（反向 transaction）
   ├─ tool_runs.status = 'failed'
   └─ 通知用户
```

**Inngest 的优势**: Step Functions 原生幂等（每个 step 自动用 step_id 去重），不用手写状态机。

### 4.11 Puppeteer 部署

**Stage 0**: 用 **Browserless.io**（$30/月起），不自建
- 省去容器维护
- 连接方式: `puppeteer.connect({ browserWSEndpoint })`

**Stage 1**: 切自建 `puppeteer-worker` service（Railway 独立应用）
- Express + puppeteer-core
- 每 1000 请求或 24h 自动重启
- web 和 puppeteer-worker 之间走 Railway 内网 DNS

### 4.12 监控与日志

| 维度 | 工具 | 备注 |
|------|------|---------|
| 应用日志 | Railway Logs | 保留 7 天，够 Stage 0 查问题 |
| Uptime | UptimeRobot（可选） | 50 monitors / 5 min，免费 |
| 错误监控 | 延后接入 | 真出线上事故再选（Sentry / BetterStack 等） |
| 产品分析 | 延后接入 | 有漏斗分析需求再选 |
| 告警 | Railway 自带 deploy 失败告警 | 邮件发送 |

---

## 五、Stage 演进摘要

详见 [`docs/stage-plan.md`](docs/stage-plan.md)。

| 阶段 | 时间 | 月成本 | 核心收款 | 关键新增 |
|------|------|-------|---------|---------|
| **Stage 0** | 现在-M2 | ~$25 | 对公转账 | Railway + Cloudflare + Inngest + OCR |
| **Stage 1** | M2-M3 | ~$75 | + Stripe | SEO 工具 + 自建 Puppeteer |
| **Stage 2** | M3+ | +¥600/月 | + 微信/支付宝 | 双轨: 海外 Railway + 国内阿里云 SAE |

**Stage 2 双轨架构**:
```
pontai.cloud (海外)  →  Railway + Cloudflare + R2（本文档方案）
pontai.com  (国内)   →  阿里云 SAE + AnalyticDB Supabase + OSS（[Stage 2 蓝图](docs/stage-2-aliyun-blueprint.md)）

同一份代码，NEXT_PUBLIC_REGION 环境变量驱动 Provider 路由。
```

---

## 六、坚决不做的事（v1.1 + v2.0 沿用）

| 不做 | 理由 |
|------|------|
| 微服务 | web + puppeteer-worker 两个 service 足够 |
| FastAPI / 独立后端 | Next.js Route Handler 够用 |
| Kubernetes | Railway 全托管 |
| GraphQL | REST + Server Actions 简单 |
| LangChain | 抽象太重，bug 多 |
| Vector DB | OCR/SEO 不需要 RAG |
| Kafka / RabbitMQ | Inngest 替代 |
| Datadog / New Relic / Sentry / PostHog | Stage 0 Railway Logs 够用，延后按需接 |
| 多区域部署（Stage 0/1）| Singapore 一个 region 够，Stage 2 再加上海 |
| 客户区子域名 | 单域名，邮件 + Magic Link 更好用 |
| 复杂权限系统 | user/staff/admin 三种角色够 |
| Dify / Coze / n8n | 自建工具更可控 |
| Vercel / Netlify / Cloudflare Pages | v1.0 已否决，不回头 |
| Supabase 全家桶（Stage 0）| 组件独立最佳，不锁定生态 |

---

## 七、Provider 抽象层（Stage 2 迁移兼容性保障）

所有外部服务必须走 Provider 抽象层，便于 Stage 2 切阿里云时只改 `process.env.PROVIDER_*` 环境变量:

```typescript
// lib/providers/types.ts

export interface IStorageProvider {
  getUploadUrl(key: string): Promise<string>
  getDownloadUrl(key: string): Promise<string>
  delete(key: string): Promise<void>
}

export interface IEmailProvider {
  sendTransactional(to: string, template: string, data: object): Promise<void>
}

export interface ISmsProvider {
  send(phone: string, template: string, data: object): Promise<void>
}

export interface ILlmProvider {
  chat(messages: Message[], opts?: LlmOptions): Promise<string>
  structuredOutput<T>(messages: Message[], schema: ZodSchema<T>): Promise<T>
}

export interface IOcrProvider {
  parse(fileUrl: string): Promise<OcrResult>
}

export interface IPaymentProvider {
  createSession(intent: PaymentIntent): Promise<PaymentSession>
  handleWebhook(rawBody: string, headers: object): Promise<PaymentEvent>
  refund(orderId: string, reason: string): Promise<RefundResult>
}
```

**Stage 0 实现**:
- Storage: `R2Provider`
- Email: `ResendProvider`
- LLM: `AnthropicProvider` / `DeepSeekProvider`
- OCR: `DeepSeekOcrProvider` / `BaiduOcrProvider`
- Payment: `BankTransferProvider`

**Stage 2 新增**（接入，不替换）:
- Storage: `AliyunOssProvider`
- Email: `AliyunDmProvider`
- Sms: `AliyunSmsProvider`
- LLM: `VolcengineProvider`
- Payment: `WeChatPayProvider` / `AlipayProvider`

**Provider 路由通过环境变量**:

```typescript
const llmProvider: ILlmProvider = 
  process.env.LLM_PROVIDER === 'anthropic' ? new AnthropicProvider()
  : process.env.LLM_PROVIDER === 'volcengine' ? new VolcengineProvider()
  : new DeepSeekProvider() // default
```

---

## 八、风险登记表

| 风险 | 阶段 | 影响 | 缓解 |
|------|------|------|------|
| Railway Singapore 对国内访问慢 | Stage 0 | 用户体验 | Cloudflare 前置 CDN 缓存静态资源，动态请求接受 ~150ms |
| Inngest 在美国，跨境延迟 | Stage 0/1 | 异步任务延迟略高 | MVP 阶段可接受，Stage 2 切 pg_cron + 自建队列 |
| DeepSeek OCR 不稳定 | Stage 0+ | 工具失败 | Provider 抽象层降级到百度 OCR |
| Anthropic Claude 海外直连失败 | Stage 0+ | LLM 失败 | 降级 DeepSeek Chat |
| R2 出口到国内偶尔慢 | Stage 0 | 文件下载慢 | Cloudflare CDN 就近分发 |
| Better Auth 项目风险 | Stage 0+ | 长期维护 | 活跃项目，备选切 Auth.js |
| Puppeteer 内存泄漏 | Stage 1 | Service 崩溃 | 每 1000 请求或 24h 重启 |
| Credits 被薅 | Stage 0+ | LLM 成本失控 | 注册送的不能用贵工具 + 多层限流 + Cloudflare rate limit |
| 那位 2999 意向老板没付款 | Stage 0 | 士气 | 同时跟 3-5 位意向客户，不 all-in 单个 |
| 顾问产能瓶颈 | Stage 0+ | 999 单接不过来 | 触发后招顾问 + 上排期系统 |
| Stage 2 切阿里云时 Auth 迁移 | Stage 2 | 用户数据迁移 | Better Auth 数据可导出，Stage 2 时手写迁移脚本 |

---

## 九、前置检查清单

详见 [`docs/checklist.md`](docs/checklist.md)。

**今天必做**:
- [ ] 确认公司主体 + 对公账户
- [ ] 注册技术账号: Railway / Cloudflare / Resend / Inngest / DeepSeek / Anthropic
- [ ] GitHub 仓库创建
- [ ] `pontai.cloud` DNS 托管到 Cloudflare

**本周必做**:
- [ ] e签宝企业版 + 3 份合同模板定稿
- [ ] Week 1 Day 1-5 任务全部跑通
- [ ] 开票软件能开第一张测试发票

**本月必做**:
- [ ] 拿下第一笔付费订单（那位 2999 意向老板）
- [ ] OCR 工具准确率 > 80%

---

## 十、技术栈一句话总结

> **Next.js + Railway + Cloudflare + PostgreSQL + Drizzle + Better Auth + R2 + Inngest + Resend + DeepSeek/Anthropic，Stage 0 最小集，海外优先，月成本 ~$15，Stage 2 切阿里云时 Provider 层切换实现。监控/分析延后按需接。**

---

## 十一、修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2026-04-23 | 初版（Vercel + Supabase 路线，被 v1.1 否决）|
| 1.1 | 2026-04-23 | 部署平台从 Vercel 切换为 Railway（前 CTO 决策）|
| 2.0 | 2026-04-23 | 全盘切换为阿里云 Supabase 全家桶（归档为 Stage 2 蓝图）|
| 3.0 | 2026-04-24 | 按 ADR-002 回到 v1.1 Railway + Cloudflare + Inngest，叠加 Stage 0 海外优先调整 |
| **3.1** | **2026-04-24** | **§3.6 强化"pricing → 合同 → 打款"三步闭环；新增 §4.7 Stage 0 对公收款流程 + §4.8 支付自动化后置存档；微信支付/支付宝明确后置到 Stage 2；后续 §4.x 章节重新编号；上一版本备份于 `docs/README-v3.0-backup.md`** |
