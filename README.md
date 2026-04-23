# 999 工具库 - 技术架构文档

> **版本**: 2.0 (阿里云 Supabase 全家桶方案)
> **日期**: 2026-04-23
> **决策**: Option B - 全盘阿里云架构

---

## 一、核心决策

### 1.1 为什么选择阿里云 Supabase 全家桶

| 因素 | 原方案 (Railway) | 新方案 (阿里云) |
|------|------------------|----------------|
| 国内访问稳定性 | 有 GFW 风险 | 国内机房，无风险 |
| 合规性 | 数据出境 | 数据全在中国境内 |
| 企业客户信任 | 需解释海外部署 | 可宣传"国产合规" |
| 成本 | ~¥200/月 | ~¥500-800/月 |
| 微信/支付原生支持 | 需自建 | 阿里云版原生支持 |

**关键转折点**: 阿里云 AnalyticDB Supabase 已于 2025.12.11 商业化，支持中国大陆部署，与官方 Supabase 100% API 兼容。

---

## 二、整体架构图

```
┌──────────────────────────────────────────────────────────────────┐
│                  浏览器 / 微信内置 WebView                           │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│    阿里云 CDN + WAF + DDoS 防护 (前置层)                            │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  阿里云 (华东 2 - 上海)                                              │
│  ─────────────────────────────────────                            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Service: web (Next.js on SAE Serverless)                  │    │
│  │  • SSR/SSG 公开页                                          │    │
│  │  • Server Actions                                          │    │
│  │  • API Routes（含支付回调）                                  │    │
│  │  • Healthcheck /api/health                                 │    │
│  └────────────────────┬─────────────────────────────────────┘    │
│                       │                                          │
│                       ▼ (VPC 内网)                               │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Service: puppeteer-worker (独立容器, VPC 隔离)             │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  阿里云 AnalyticDB Supabase（核心后端）                      │    │
│  │  ────────────────────────────                              │    │
│  │  • Database: PostgreSQL 全托管                              │    │
│  │  • Auth: 手机号 OTP + 微信 OAuth                            │    │
│  │  • Storage: S3 兼容（文件存储）                              │    │
│  │  • Edge Functions（异步任务）                                │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  阿里云 Tair Redis (按需启用，MVP 暂不开)                    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  阿里云 SLS 日志服务 + 云监控                                  │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘

        ┌────────────────────────┼─────────────────────────────┐
        ▼                        ▼                             ▼
┌──────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  微信支付 v3      │  │  阿里云短信            │  │  AI Provider         │
│  + 支付宝(后)     │  │                       │  │  • DeepSeek OCR      │
│                   │  │                       │  │  • DeepSeek Chat     │
│                   │  │                       │  │  • 火山方舟 Claude   │
│                   │  │                       │  │  • 百度 OCR(兜底)    │
└──────────────────┘  └──────────────────────┘  └──────────────────────┘
```

---

## 三、技术栈决策表

### 3.1 应用层

| 维度 | 选型 | 说明 |
|------|------|------|
| Web 框架 | Next.js 14+ (App Router) | 不变 |
| 部署 | **阿里云 SAE** | Serverless 应用引擎，Railway 等价物 |
| 语言 | TypeScript (strict) | 全栈类型安全 |
| UI | Tailwind + Radix Primitives | 不变 |
| 表单 | react-hook-form + zod | 不变 |
| 数据获取 | Server Actions + RSC | 不变 |

### 3.2 持久层

| 维度 | 选型 | 说明 |
|------|------|------|
| 数据库 | **阿里云 AnalyticDB Supabase** | 替代 Railway PG |
| ORM | Drizzle | 兼容标准 PG 协议 |
| 文件存储 | **Supabase Storage** | 替代 R2 |
| 缓存 | MVP 不开，必要时 Tair | 替代 Redis |

### 3.3 认证层

| 维度 | 选型 | 说明 |
|------|------|------|
| 认证核心 | **Supabase Auth (阿里云版)** | 替代 Lucia/Better Auth |
| 登录方式 | 手机号 OTP (主) + 微信 OAuth | Supabase 原生支持 |
| 短信通道 | 阿里云短信 | 通过 Supabase SMS hook 接入 |
| Session | Supabase JWT + refresh token | 无需自建 |

### 3.4 异步任务

| 维度 | 选型 | 说明 |
|------|------|------|
| 任务队列 | **Supabase Edge Functions + pg_cron** | 替代 Inngest，全境内 |
| 定时任务 | pg_cron (Supabase 原生) | 替代 Inngest Cron |
| Webhook 处理 | Edge Functions | 异步处理支付回调 |

### 3.5 AI 与外部服务

| 维度 | 选型 | 说明 |
|------|------|------|
| OCR | DeepSeek OCR | 不变 |
| OCR 兜底 | 百度 OCR | 不变 |
| LLM | 火山方舟 (Claude/DeepSeek) | 国内合规代理 |
| 网页抓取 | Puppeteer on 阿里云容器 | 独立 service |
| Provider 抽象 | 自写薄抽象层 | 不变 |

### 3.6 支付与通知

| 维度 | 选型 | 说明 |
|------|------|------|
| 支付 | 微信支付 v3 (JSAPI + Native) | 不变 |
| 备选 | 支付宝当面付 (阶段2) | 不变 |
| 邮件 | **阿里云邮件推送 DM** | 替代 Resend |
| 短信 | 阿里云短信 | 不变 |

---

## 四、关键架构决策

### 4.1 为什么用阿里云 SAE 而不是 ECS/ACK/FC

| 方案 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| ECS | 最灵活 | 要管 OS、扩缩、部署 | ❌ 太原始 |
| ACK (K8s) | 企业级 | 太重，MVP 过度工程 | ❌ 已否决 |
| FC (函数计算) | 极简 | 不适合 Next.js 长进程 | ❌ 同 Vercel 问题 |
| **SAE** | 长进程 + 按量 + 免编排 | 稍贵于 FC | ✅ **选定** |

### 4.2 异步任务：Supabase Edge Functions 替代 Inngest

**为什么换**:
- Inngest 数据在美国，跨境合规风险
- Edge Functions 在中国大陆执行
- 任务量 MVP < 1 万/月，Edge Functions 完全够用

**方案**:
- OCR/SEO 等长任务 → Supabase Edge Functions
- 定时任务 → pg_cron (Supabase 原生)
- 重试/退避 → 手写 + 数据库状态机 (简单够用)

**不选的方案**:
- 阿里云 FC + MNS：胶水代码太多
- pg-boss：拖慢 PG，MVP 阶段没必要

### 4.3 文件上传与存储

**Presigned URL 模式** (同原方案，换供应商):
```
[浏览器] → [请求上传凭证] → [SAE web] → [Supabase Storage]
                                        ↓
[浏览器] ← [Presigned URL] ←────────────┘
   │
   │ 直接 PUT 到 Supabase Storage
   ↓
[上传完成] → 提交 r2_key 到 web → 触发 Edge Function 处理
```

**关键改动**:
- R2 → Supabase Storage
- 生命周期策略: Supabase Storage Bucket Policy 设置 30 天自动删除
- 所有读取走 Presigned URL (10 分钟过期)

### 4.4 认证流程 (Supabase Auth)

```
用户输入手机号
   ↓
[阿里云短信] 发送 6 位 OTP (通过 Supabase SMS hook)
   ↓
Supabase 验证 OTP
   ↓
自动创建用户 + JWT session
   ↓
Cookie 写回浏览器
   ↓
后续请求: Supabase validateSession
```

**防滥用**:
- 同手机号 1 小时最多 5 条 OTP (Supabase 内置限流)
- OTP 5 分钟过期
- 输错 5 次锁定该 OTP

### 4.5 微信支付回调 (三层保险保留)

**第一层**: Next.js API Route 接收
- 验签 → 解密 → 写入 `payment_events` 表 (event_id UNIQUE)
- 立即返回 200 (微信要求 5 秒内)

**第二层**: Supabase Edge Function 异步处理
- 监听 `payment_events` INSERT
- 执行业务: 发 credits、创建订单、发邮件
- 幂等: 用 event_id 去重

**第三层**: 主动查询兜底
- 前端支付成功页 30 秒未刷新 → 主动查微信订单状态
- pg_cron 每 5 分钟扫 PENDING 超 10 分钟订单

### 4.6 Credits 扣费事务 (不变)

3 张表 + 严格流水模型保留:
- `credit_balances`: 当前余额 (事实来源)
- `credit_transactions`: 流水账 (append-only)
- `tool_runs`: 工具调用记录

**核心规则**:
1. balance 永远 = transactions 累加
2. 修改 balance 必须事务 + 行锁 (`SELECT ... FOR UPDATE`)
3. transactions 绝不允许 UPDATE/DELETE
4. 加 CHECK constraint: `available_credits >= 0`

### 4.7 失败处理与退款 (Inngest → Edge Functions)

```
[用户触发工具调用]
        ↓
[Step 1: 预扣 credits] ← PG 事务 + 行锁
        ↓
[Step 2: 入库 tool_runs (status=pending)]
        ↓
[Step 3: 触发 Edge Function]
        ↓
─────────────────────────────────────
        ↓ (异步)
[Edge Function 调用 AI Provider]
   ├─ 成功 → 解析结果 → 写入 DB → 调整 credits → success
   └─ 失败 → 重试 3 次 → 仍失败 → 退还 credits → failed
        ↓
[前端轮询拿到状态 → 渲染结果/错误]
```

**注意**: Edge Functions 没有 Inngest Step Functions 的断点续跑，需要:
- 每个 step 幂等 (用 step_id + DB 唯一约束)
- 失败时显式写反向操作 (退 credits)
- 超时设 5 分钟硬限制

### 4.8 Puppeteer 部署 (阿里云容器)

独立容器 service (VPC 内网通讯):
```
[Edge Function]
   ↓ HTTP 调用 (VPC 内网)
[puppeteer-worker service]
   • Express + puppeteer-core
   • 每次抓取后关闭 page
   • 每 1000 请求或 24h 重启浏览器
```

**MVP 阶段建议**: 先用托管 (Browserless.io 或等效)，稳定后再自建。

### 4.9 监控与日志 (阿里云原生)

| 维度 | 工具 | 说明 |
|------|------|------|
| 错误监控 | **阿里云 SLS + 云监控** | 免费额度覆盖 MVP |
| 产品分析 | **阿里云 ARMS / 自研埋点** | 或后续接入 |
| 应用日志 | SLS 日志服务 | 自动采集 |
| 告警 | 云监控 → 钉钉/飞书 webhook | 关键路径必须告警 |

---

## 五、Feature 路线图 (M0-M5)

### M0: 基础设施 (Week 1)

**前置检查** (必须全部完成才能开始):
- [ ] ICP 备案提交 (20 工作日) ⭐ 立即启动
- [ ] 微信支付商户号开户 (7-15 工作日) ⭐ 立即启动
- [ ] 阿里云账号企业认证
- [ ] 域名 ICP 备案确认 (`.cloud` 能否备案? 不能则买 `.com`)

**技术任务**:
- [ ] 阿里云 AnalyticDB Supabase 实例开通
- [ ] 阿里云 SAE 创建 web + puppeteer-worker 两个应用
- [ ] Supabase schema 初始化 (users / credits / transactions / tool_runs / files)
- [ ] Supabase Auth + 阿里云短信 OTP 跑通
- [ ] 阿里云邮件推送域名验证
- [ ] 阿里云 CDN + WAF 配置 (等 ICP 通过后)
- [ ] 微信支付 SDK 接入 (开发环境)

**出口标准**: 能注册账号、收到 OTP、看到 50 credits、上传文件到 Supabase Storage、跑通 Edge Function Hello World。

---

### M1: 第一个工具 OCR (Week 2)

- [ ] 工具列表页 `/tools`
- [ ] OCR 工具页 `/tools/ocr-invoice` (上传 + 结果展示)
- [ ] OCR 流程: DeepSeek OCR → 火山方舟 Claude 后处理 → 结构化输出
- [ ] Supabase Edge Function 执行 OCR 流程
- [ ] 前端轮询任务状态
- [ ] 失败处理: 退 credits + 友好错误提示
- [ ] Prompt 管理: `prompts/` 文件夹结构
- [ ] 5 个真实 PDF 测试

**出口标准**: 5 个真实老板能上传 PDF，准确率 > 80%。

---

### M2: 第二个工具 SEO 诊断 (Week 3)

- [ ] SEO 工具页 `/tools/seo-audit`
- [ ] 抓取层: web service 调 puppeteer-worker 内网接口
- [ ] 技术 SEO 检测: 基于规则 (title/meta/heading/performance)
- [ ] GEO 评分: 火山方舟 Claude 评估 + 建议生成 (structured output)
- [ ] 报告页: HTML 渲染 + PDF 导出 (Edge Function 生成)
- [ ] Lead 钩子: 报告问题 > 3 项 → 弹窗"999 诊断"

**出口标准**: 输入任意 URL，60 秒内出报告，至少 3 个真实可执行建议。

---

### M3: 案例库 (Week 3 末)

- [ ] 案例库列表页 `/cases`
- [ ] 3-5 个真实案例 MDX (场景 → 痛点 → 方案 → ROI)
- [ ] 案例详情页 CTA: "试这个工具"
- [ ] 转化埋点: 案例 PV → CTA 点击 → 注册 → 试用的完整漏斗

**出口标准**: 朋友圈分享一篇案例，能跟踪 PV → 工具试用的完整路径。

---

### M4: 999 套餐 + 微信支付 (Week 4)

- [ ] 999 落地页 `/diagnosis`
- [ ] 微信支付 v3: JSAPI (微信内) + Native (PC)
- [ ] 支付回调: 验签 + 幂等 + Edge Function 异步处理
- [ ] 支付成功页: 双 CTA (填问卷 / 加微信)
- [ ] 会前问卷: 3 个必填字段
- [ ] 顾问后台: 标记完成 + 上传交付 PDF
- [ ] 交付通知: 阿里云邮件 + 短信
- [ ] 主动查询兜底: pg_cron 扫 PENDING 订单

**出口标准**: 完成第一笔真实付费 999 + 完整履约 + 客户反馈"值"。

---

### M5: 30 单后优化 (Month 2)

- [ ] Admin 数据看板: 转化漏斗 / credits 消耗 / 工具受欢迎度
- [ ] 第三个工具立项 (基于前 30 单反馈)
- [ ] Prompt v2 迭代
- [ ] 支付宝接入
- [ ] Tair Redis 评估 (限流/缓存需求触发时)

**出口标准**: 月单量稳定 30+，2999 升级率 > 15%。

---

## 六、坚决不做的事 (原 §六 保留)

| 不做 | 理由 |
|------|------|
| 微服务 | web + puppeteer-worker 两个 service 够 |
| FastAPI / 独立后端 | Next.js Route Handler 够用 |
| Kubernetes | SAE 全托管，不需要 K8s |
| GraphQL | REST + Server Actions 简单 |
| LangChain | 抽象太重，bug 多 |
| Vector DB | OCR/SEO 不需要 RAG |
| Kafka/RabbitMQ | Supabase Edge Functions 替代 |
| ELK/Datadog | SLS + 云监控够 |
| 多区域部署 | 国内用户为主，上海一个 region 够 |
| 客户区子域名 | 单域名，邮件 + Magic Link 更好用 |
| 复杂权限系统 | user/staff/admin 三种角色够 |
| Dify/Coze/n8n | 自建工具更可控 |

---

## 七、风险登记表

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| **ICP 备案超时** | 无法上线 | 今天立即启动，买备用域名 `.com` |
| **微信支付商户号审核慢** | M4 延期 | 今天立即申请，准备完整材料 |
| `.cloud` 域名备案被拒 | 需换域名 | 立即确认或买 `.com` 备用 |
| DeepSeek OCR 不稳定 | 工具失败率高 | Provider 抽象层降级到百度 OCR |
| 火山方舟 Claude 不稳定 | LLM 失败 | 抽象层降级到 DeepSeek Chat |
| Supabase Edge Functions 并发限制 | 任务排队 | MVP 阶段任务量小，上量后评估换方案 |
| pg_cron 定时任务漂移 | 主动查询不准 | 用 application 层定时任务兜底 |
| Puppeteer 内存泄漏 | service 崩溃 | 定期重启策略 (每 1000 请求/24h) |
| Credits 被薅 | LLM 成本失控 | 注册送的不能用贵工具 + 多层限流 |
| 顾问产能瓶颈 | 999 单接不过来 | 好问题；触发后招顾问 + 上排期系统 |

---

## 八、前置检查清单 (M0 前必须完成)

| # | 事项 | 状态 | 负责人 | 截止时间 |
|---|------|------|--------|----------|
| 1 | ICP 备案提交 | ⬜ | 你 | 今天 |
| 2 | 微信支付商户号开户 | ⬜ | 你/财务 | 今天 |
| 3 | 阿里云账号企业认证 | ⬜ | CTO | 本周 |
| 4 | 域名备案确认 (`.cloud`?) | ⬜ | 你 | 今天 |
| 5 | 阿里云短信模板审批 | ⬜ | 运营 | 本周 |
| 6 | 5 份真实 PDF 样本准备 | ⬜ | 你 | 本周 |
| 7 | 技术栈 RFC 文档 CTO 签字 | ⬜ | CTO | 本周 |

---

## 九、技术栈一句话总结

> **Next.js + 阿里云 SAE + 阿里云 AnalyticDB Supabase + 阿里云 CDN + 微信支付 + DeepSeek/火山方舟，全栈阿里云生态，数据全在中国境内，MVP 到 1000 用户/月这套架构无需改动，单月成本 ~¥500-800。**

---

## 十、修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2026-04-23 | 初版 (Vercel + Supabase 路线) |
| 1.1 | 2026-04-23 | 部署平台从 Vercel 切换为 Railway |
| **2.0** | **2026-04-23** | **全盘切换为阿里云 Supabase 全家桶，国内部署合规版** |
