# Stage 0 前置检查清单

**版本**: 3.0
**日期**: 2026-04-24
**基于**: [ADR-002](adr-002-global-first-mvp.md) + [roadmap.md v3.0](roadmap.md)
**状态**: Stage 0 启动前必须完成

---

## 原则

- ✅ 必做: Stage 0 启动前打勾
- 🟡 可后补: 不阻塞 Stage 0 启动，但 Week 2 前补齐
- ❄️ 归档延后: Stage 2 才需要，现在不做（见 [aliyun-decisions.md](aliyun-decisions.md)）

---

## 🚨 P0 - 必须先解决（今天/本周）

### 1. 公司主体与对公账户确认 ✅

**你说已有两个公司主体和对公账户，所以下面这些只是确认清单:**

- [ ] 选定用于本项目收款的公司主体（业务最清晰/纳税最规范的那家）
- [ ] 记录公司 A 信息:
  - 公司全称
  - 统一社会信用代码
  - 对公账户（户名、开户行、账号）
  - 法人姓名和联系方式
  - 税务性质（小规模纳税人 / 一般纳税人）
- [ ] 记录公司 B 信息（同上）
- [ ] 决定: 主要用 A 还是 B 做本项目收款？
  - 建议选**一般纳税人**（如有）的那家，能开专票覆盖更多客户
  - 或选**小规模纳税人**（3% 税率，对客户成本低）
- [ ] 确认该公司有**对公账户转账进账短信提醒**（用于第一时间确认到账）
- [ ] 归档资料到加密云盘:
  - 营业执照扫描件
  - 法人身份证正反面
  - 公章 + 财务章扫描件
  - 对公账户信息 PDF

---

### 2. 电子合同工具 🟡

- [ ] 注册 e签宝企业版（esign.cn）或法大大（fadada.com）
- [ ] 企业实名认证（上传营业执照 + 法人人脸识别）
- [ ] 启用企业签章服务
- [ ] 找法务朋友或购买律师服务审阅合同模板（1000-3000 一次性）
- [ ] 3 份合同模板定稿:
  - [ ] 《信息化咨询服务协议》 — 999 元
  - [ ] 《AI 工具 SaaS 服务订阅协议》 — 2999 元
  - [ ] 《年度服务协议（含打包优惠）》 — 36000 元

**要点**: 合同模板用 Word 写完后，传到 e签宝/法大大作为企业模板，后续签约点几下就能发出去。

---

### 3. 开票能力准备 🟡

- [ ] 确认开票软件（税务局指定，一般叫"增值税发票税控开票软件"）
- [ ] 登录成功，能开 1 张测试发票（¥0.01）
- [ ] 准备电子发票信息模板（项目名称: 技术服务费 / 咨询服务费 / 软件服务费）
- [ ] 发票邮件模板（PDF 附件 + 正文说明）

---

## 🔧 P1 - 技术账号注册（Day 1 完成）

### 4. 部署与基础设施

- [ ] **Railway** (https://railway.app)
  - GitHub 登录
  - 创建 project "pontai"
  - 添加 PostgreSQL plugin（同 Singapore region）
  - 记录: `DATABASE_URL`

- [ ] **Cloudflare** (https://dash.cloudflare.com/sign-up)
  - 添加 `pontai.cloud` 域名（从域名商切 DNS 到 Cloudflare）
  - DNS 记录: CNAME 指向 Railway 的应用域名（`xxx.up.railway.app`）
  - 启用 Proxy（橙色云）+ 免费 SSL（Full mode）
  - 记录: `CLOUDFLARE_ACCOUNT_ID`

- [ ] **Cloudflare R2**（Cloudflare 账号内开通）
  - 创建 bucket `pontai-uploads`
  - 生成 R2 API token（S3 兼容凭证）
  - 配置 CORS（允许 `https://pontai.cloud` PUT/GET）
  - 记录: `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_ENDPOINT` / `R2_BUCKET_NAME`

- [ ] **GitHub** 仓库
  - 创建私有仓库（`pontai` 或复用 `app.pontservice`）
  - 配置 Railway GitHub App 集成（push to main → auto deploy）

### 5. 异步任务、邮件、监控、分析

- [ ] **Inngest** (https://www.inngest.com/signup)
  - 创建 app "pontai"
  - 生成 `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY`
  - 免费 tier: 50k steps/月

- [ ] **Resend** (https://resend.com/signup)
  - 免费 3000 邮件/月
  - 添加发送域名: `pontai.cloud`
  - 配置 DNS TXT/CNAME 记录（通过 Cloudflare）
  - 发一封测试邮件成功
  - 生成 `RESEND_API_KEY`

- [ ] **UptimeRobot** (https://uptimerobot.com) (可选)
  - 免费 50 monitors
  - 监控 `/api/health`

> 注：错误监控（Sentry 等）和产品分析（PostHog 等）Stage 0 暂缓。真遇到线上事故或者要做漏斗分析时再接入，代码里没绑死任何 SDK。

### 6. AI 服务账号

- [ ] **DeepSeek API** (https://platform.deepseek.com)
  - 注册 + 实名
  - 充值 ¥50（测试充足）
  - 生成 `DEEPSEEK_API_KEY`

- [ ] **Anthropic Claude** (https://console.anthropic.com)
  - 注册（需要海外信用卡）
  - 充 $10
  - 生成 `ANTHROPIC_API_KEY`

- [ ] **Browserless** (https://browserless.io) (Stage 1 再开，Stage 0 跳过)
  - 用于 Puppeteer 托管
  - Stage 0 不开，Stage 1 再决定

### 7. 电子合同账号

- [ ] **e签宝** (https://www.esign.cn) 或 **法大大** (https://www.fadada.com)
  - 企业实名
  - 生成 API key（未来自动化用）
  - 3 份合同模板上传

---

## 🖥️ P2 - 本地开发环境（Day 1 完成）

### 8. 本地工具

- [ ] **Node.js 20+** 安装
- [ ] **pnpm 9.15.4** 安装（项目已通过 `package.json` 的 `packageManager` 字段锁定；运行 `corepack enable` 即可，在项目目录下会自动对齐到该版本）
- [ ] **Git** 配置
- [ ] **Docker Desktop** 安装（Dockerfile 本地测试）
- [ ] **Railway CLI** 安装 (`brew install railway`) - 可选
- [ ] **Cloudflare Wrangler CLI** 安装 - 可选

### 9. 编辑器配置

- [ ] VS Code / Cursor 安装
- [ ] 插件:
  - TypeScript / ESLint / Prettier
  - Tailwind CSS IntelliSense
  - Drizzle ORM
  - GitLens
  - Docker

### 10. 项目初始化

```bash
pnpm create next-app@latest pontai \
  --typescript --tailwind --eslint \
  --app --src-dir --import-alias "@/*"
```

- [ ] 创建 Next.js 项目
- [ ] 连接 GitHub 仓库
- [ ] Dockerfile 定稿（`output: 'standalone'`，`node:20-alpine` base）
- [ ] `railway.toml` 配置
- [ ] Railway 首次部署成功
- [ ] Cloudflare DNS 生效，`pontai.cloud` 能访问 Next.js 默认页

---

## 📝 P3 - 文档与规范（Week 1 完成）

### 11. 项目文档

- [x] ~~[README.md](../README.md)~~ — 顶部加版本切换说明（本次更新）
- [x] ~~[ADR-002](adr-002-global-first-mvp.md)~~ — 架构决策（本次新建）
- [x] ~~[stage-plan.md](stage-plan.md)~~ — 三阶段路线（本次新建）
- [x] ~~[aliyun-decisions.md](aliyun-decisions.md)~~ — 阿里云清单（本次新建）
- [x] ~~[payment-plan.md](payment-plan.md)~~ — 支付体系（本次新建）
- [x] ~~[roadmap.md](roadmap.md)~~ — 开发路线（本次更新）
- [x] ~~[checklist.md](checklist.md)~~ — 本文档（本次更新）

### 12. 开发规范

- [ ] ESLint config（严格模式）
- [ ] Prettier config
- [ ] TypeScript strict: true
- [ ] Husky + lint-staged (pre-commit hook)
- [ ] `.env.local.example` 模板
- [ ] Conventional Commits 规范

---

## 💾 P4 - 数据库 Schema（Week 1 Day 2 完成）

### 13. 核心表

Stage 0 一次性建全，避免后期频繁迁移:

- [ ] `users`（Better Auth 扩展字段）
  - 基础字段由 Better Auth 管理: id, email, emailVerified, name, image, createdAt, updatedAt
  - 扩展字段: full_name, company_name, phone, role
  - role: `user | staff | admin`

- [ ] `credit_balances`
  - 字段: user_id (PK), available_credits, total_granted, total_consumed, updated_at
  - CHECK: `available_credits >= 0`

- [ ] `credit_transactions`（append-only）
  - 字段: id, user_id, amount, type, reason, order_id, tool_run_id, balance_after, created_at
  - type: `grant | consume | refund | adjust`
  - 不允许 UPDATE/DELETE（通过 trigger 或 RLS 强制）

- [ ] `tool_runs`
  - 字段: id, user_id, tool_slug, status, input, output, error, credits_cost, started_at, completed_at
  - status: `pending | running | succeeded | failed | refunded`

- [ ] `files`
  - 字段: id, user_id, storage_key, filename, size_bytes, mime_type, upload_status, expires_at, created_at
  - expires_at: 默认 30 天后，到期自动清理

- [ ] `leads`
  - 字段: id, company_name, contact_name, email, phone, interested_plan, use_case, notes, source, status, assigned_to, created_at, updated_at
  - status: `new | contacted | contract_sent | paid | activated | lost`

- [ ] `orders`
  - 字段: id, order_number, lead_id, user_id, plan_type, amount_cny, early_bird, actual_amount_cny, status, contract_id, contract_url, payment_method, payment_reference, paid_at, activated_at, credits_granted, invoice_number, invoice_url, notes, created_at, updated_at
  - status: `pending | contract_sent | paid | activated | refunded | cancelled`
  - payment_method: `bank_transfer | stripe | wechat_pay | alipay`

- [ ] `payment_events`（Stage 1/2 用，Stage 0 先建表）
  - 字段: id, event_id (UNIQUE), provider, raw_payload (jsonb), order_id, processed, processed_at, created_at

### 14. 数据权限

- [ ] 应用层权限控制（Better Auth session + 路由守卫）
- [ ] user 只能查自己的 credit_balances / credit_transactions / tool_runs / files / orders
- [ ] admin 路由单独加 role check
- [ ] leads 表 API 层限制写入频率（Cloudflare Rate Limit）
- [ ] **可选**: PostgreSQL RLS policy（为 Stage 2 切 Supabase Auth 铺路）

### 15. 索引

- [ ] `credit_transactions (user_id, created_at DESC)` - 流水查询
- [ ] `tool_runs (user_id, status)` - 我的任务
- [ ] `files (user_id, expires_at)` - 过期清理
- [ ] `orders (status, created_at DESC)` - admin 未处理订单
- [ ] `orders (user_id, created_at DESC)` - 我的订单
- [ ] `leads (status, created_at DESC)` - admin 跟进

---

## 🎨 P5 - UI 基础（Week 1 Day 3-4）

### 16. 设计系统

- [ ] 主色定稿（建议: 中性色 + 一个主色调，不要太花）
- [ ] 字体: Inter（英文）+ 苹方/思源（中文）
- [ ] 图标库: Lucide React
- [ ] 组件库: 自己用 Radix Primitives 封装（不用 shadcn 的话）或直接用 shadcn/ui

### 17. 关键页面框架

- [ ] `/` 首页
- [ ] `/login` 登录
- [ ] `/pricing` 定价
- [ ] `/pricing/apply` 申请
- [ ] `/account` 用户中心
- [ ] `/tools` 工具列表
- [ ] `/tools/ocr-invoice` OCR 工具
- [ ] `/admin` 后台布局
- [ ] `/admin/leads` 客户咨询
- [ ] `/admin/orders` 订单
- [ ] `/admin/activate` 手动激活

---

## 📦 P6 - 运营准备（Week 1-2）

### 18. 内容准备（你亲自做）

- [ ] **5 份真实 PDF 样本**（制造业场景优先）
  - 发票、合同、报价单、质检报告等
  - 每份标注期望提取字段
  - Week 2-3 OCR 测试用

- [ ] 产品故事/价值主张文案（3 个版本 A/B 测试）
- [ ] 案例骨架（Week 5 整理，现在先占位）
- [ ] FAQ 草稿（定价、发票、退款、数据安全）

### 19. 销售准备

- [ ] 那位 2999 意向老板的跟进计划:
  - [ ] Week 1 末发 demo 链接让他试用
  - [ ] Week 2 末让他跑他自己的真实 PDF
  - [ ] Week 3 签约 + 收款
- [ ] 其他 3-5 个潜在客户列表（关系网络）
- [ ] 销售话术 v1（不需要完美，有个底稿就行）
- [ ] 朋友圈/微信群宣传文案（启动时用）

### 20. 顾问资源（999 咨询交付）

- [ ] 顾问名单（1-2 人起步）
- [ ] 每周可接单量（初期 2-3 单/周是健康区间）
- [ ] 顾问酬劳结构（按单 / 按小时 / 分成）
- [ ] 顾问微信准备好（交付沟通用）

---

## ❄️ 归档延后（Stage 2 再做）

以下事项明确**不在** Stage 0 启动前做:

- ❄️ ~~ICP 备案提交~~ → Stage 2 启动前 20 工作日再做
- ❄️ ~~阿里云企业认证~~ → Stage 2 启动前做
- ❄️ ~~AnalyticDB Supabase 开通~~ → Stage 2 启动时做
- ❄️ ~~阿里云 SAE~~ → Stage 2 启动时做
- ❄️ ~~阿里云短信/邮件/CDN/WAF~~ → Stage 2 启动时做
- ❄️ ~~微信支付商户号申请~~ → Stage 2 启动前 15 工作日做
- ❄️ ~~支付宝开放平台认证~~ → Stage 2 启动前做
- ❄️ ~~购买 `.com` 备用域名~~ → **建议今天就买一个，¥55-90/年，防止抢注**

**唯一建议立刻做的是买 `pontai.com` 域名**（或 `.cn`），因为这是单点阻塞，而且便宜。不立刻用，但要占上。

---

## ✅ Stage 0 启动就绪检查

以下全部打勾才能开始写代码:

**法律与财务就绪**:
- [ ] 公司主体选定 + 对公账户信息归档
- [ ] 电子合同工具账号 + 3 份模板定稿
- [ ] 开票软件能开第一张发票

**技术账号就绪**:
- [ ] Railway / Cloudflare / Inngest / Resend 全部注册
- [ ] R2 bucket 创建 + API token
- [ ] DeepSeek / Anthropic API 充值 + key 拿到
- [ ] GitHub 仓库建好，Railway 集成完成
- [ ] `pontai.cloud` DNS 切到 Cloudflare + 指向 Railway

**本地开发就绪**:
- [ ] Node / pnpm / Git / Docker 安装
- [ ] 编辑器 + 必要插件就位

**运营准备就绪**:
- [ ] 5 份真实 PDF 样本准备好
- [ ] 那位 2999 意向老板的跟进节奏商定
- [ ] 顾问资源确认

**文档与规范就绪**:
- [x] ADR-002 已落地
- [x] 本文档已落地
- [ ] 仓库初始化时 ESLint/Prettier/Husky 就绪

---

## ⚠️ 常见坑预警

### 坑 1: 开票信息没先确认
**症状**: 开完发票客户说抬头错了
**对策**: 到账后先邮件确认抬头信息，客户书面回复后再开票

### 坑 2: 合同没写清"激活"定义
**症状**: 客户说"我没真用过，凭什么不退"
**对策**: 合同明确"激活"定义（发送激活邮件即视为激活），退款条款按"激活后 N 天"起算

### 坑 3: 早鸟价没限制数量
**症状**: 前期承诺"早鸟价"，50 单后客户说"早鸟能不能给我"
**对策**: 合同和营销页明确"前 10 位客户"，超过的新客户尊重老客户价格承诺，但新合同恢复原价

### 坑 4: Credits 规则模糊
**症状**: 客户问"我的 credits 用不完能不能退钱"
**对策**: 合同明确 credits 为服务附赠权益，不兑现现金；年付按月退款，credits 同比例扣除

### 坑 5: 数据泄露
**症状**: 客户上传合同/发票后担心数据泄露
**对策**: 
- 合同明确保密条款
- 应用层权限控制（Better Auth session 校验）
- 上传文件 30 天后自动删除（Inngest Cron + R2 lifecycle rule）
- 不用来训练模型（合同明确）

### 坑 6: DeepSeek/Anthropic 突然限额
**症状**: 高峰期 API 失败率突增
**对策**: Provider 抽象层 Day 1 就设计好降级链，不要"等遇到再说"

### 坑 7: 权限校验写错
**症状**: 用户能看到别人的数据
**对策**: 
- 每个 API route 必须 `requireUser()` 或 `requireAdmin()`
- 所有 DB 查询必须带 `user_id` 过滤
- 写集成测试覆盖权限场景

### 坑 8: 那位 2999 老板一直"再看看"
**症状**: 意向客户拖延，既不签也不退
**对策**: 
- 每周主动跟进一次，超过 3 次未响应视为流失
- 不 all-in 单个客户，同时跟 3-5 个
- "早鸟价限前 10 位"制造紧迫感

---

## 相关文档

- [README.md](../README.md)
- [ADR-002](adr-002-global-first-mvp.md)
- [stage-plan.md](stage-plan.md)
- [aliyun-decisions.md](aliyun-decisions.md)
- [payment-plan.md](payment-plan.md)
- [roadmap.md](roadmap.md)

---

## 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2026-04-23 | 初版（v1.0 Railway 版） |
| 2.0 | 2026-04-23 | v2.0 阿里云版重写 |
| **3.0** | **2026-04-24** | **按 ADR-002 改为 Stage 0 清单，阿里云项移至归档延后区** |
