# Pontai 开发路线图 (Stage 0 / 1 / 2)

**版本**: 3.0
**日期**: 2026-04-24
**基于**: [ADR-002](adr-002-global-first-mvp.md) 的三阶段演进
**覆盖**: [roadmap.md v2.0](./roadmap.md) 的 M0-M5 节奏（已归档为 Stage 2 蓝图）

---

## 总览

| 阶段 | 时间窗口 | 目标 | 核心里程碑 |
|------|---------|------|----------|
| **Stage 0** | W1-W8 | 验证 + 前 10 单 | W1 基础设施 / W2-3 OCR / W4-8 收单迭代 |
| **Stage 1** | M2-M3 | 海外自动化 + 扩展 | Stripe / SEO 工具 / 前 100 单 |
| **Stage 2** | M3+ | 国内规模化 + 开课 | 双轨 / 微信支付 / 开课 |

---

## 第 0 阶段 (Stage 0): 海外 MVP + 手工收单

**时长**: 8 周 (Week 1-8)
**架构**: Railway + Cloudflare + Inngest + R2 + Better Auth（严格继承 v1.1）
**投资**: ~$25/月 + 一次性公司准备 ¥500-1500
**退出**: 10 个付费订单 + OCR 准确率 > 80%

---

### Week 1: 基础设施 + 收款闭环

#### Day 1（今天）: 账号与基础部署

**技术准备**:
- [ ] 注册 Railway（GitHub OAuth）
- [ ] 注册 Cloudflare（域名 DNS 托管）
- [ ] 注册 Inngest（异步任务）
- [ ] 注册 Resend（邮件，免费 3000/月）
- [ ] 注册 DeepSeek API（充 ¥50 够 MVP 测试）
- [ ] 注册 Anthropic Claude API（充 $10 够 MVP 测试）

**GitHub 仓库**:
- [ ] 创建 GitHub 私有仓库
- [ ] Railway 连接仓库，启用自动部署（push to main → deploy）
- [ ] `pontai.cloud` DNS 从域名商切到 Cloudflare 托管
- [ ] Cloudflare 添加 CNAME 指向 Railway 应用域名
- [ ] Cloudflare 启用 Proxy（橙色云）+ 免费 SSL

**Railway 项目结构**:
- [ ] Railway 新建 project "pontai"
- [ ] 添加 PostgreSQL plugin（同 region）
- [ ] 添加环境变量（DATABASE_URL 自动注入）
- [ ] 配置 `railway.toml` 指定 Dockerfile

**Cloudflare R2**:
- [ ] 创建 bucket `pontai-uploads`
- [ ] 生成 API token（S3 兼容）
- [ ] 配置 CORS 允许 `pontai.cloud` 上传

**Next.js 脚手架**:
```bash
pnpm create next-app@latest pontai --typescript --tailwind --eslint --app --src-dir
```
- [ ] 初始化仓库结构（参考下文 §Week 1 仓库结构）
- [ ] 基础 UI 主题（Tailwind + Radix Primitives）
- [ ] Dockerfile（`node:20-alpine` base + `output: 'standalone'`）
- [ ] Drizzle 配置（连接 Railway PostgreSQL）

#### Day 2: 数据库 Schema

**核心表一次建全**（避免后期迁移）:

- [ ] `users`（Better Auth 扩展字段）
- [ ] `credit_balances`
- [ ] `credit_transactions`（append-only）
- [ ] `tool_runs`
- [ ] `files`
- [ ] `leads`（客户咨询）
- [ ] `orders`（订单）
- [ ] `payment_events`（Stage 1/2 用，表结构先建）

- [ ] PostgreSQL row level security（通过 Drizzle 写 policy）
- [ ] 迁移脚本 + seed 数据
- [ ] Drizzle Studio 能打开 + CRUD 测试

#### Day 3: 认证 + Credits

- [ ] Better Auth 集成
  - 邮箱 OTP 登录（via Resend Provider）
- [ ] 登录页 `/login`
- [ ] 首次登录自动创建 user 记录 + 赠 50 credits
- [ ] 用户中心 `/account`
  - 显示余额
  - 流水列表（最近 50 条）

#### Day 4: 营销页 + 意向表单

- [ ] `/`（首页，价值主张 + 案例 + CTA）
- [ ] `/pricing`（三档套餐展示）
  - ¥999 诊断
  - ¥2999 OCR 工具包
  - ¥9999 增长陪跑包
  - 早鸟价标注
- [ ] `/pricing/apply`（意向表单）
- [ ] API `POST /api/leads`（写入 leads 表 + Resend 发邮件通知）
- [ ] 感谢页 `/pricing/apply/success`

#### Day 5: Admin 后台 + 合同模板

**Admin 后台**（只管理员可访问）:
- [ ] `/admin` 布局
- [ ] `/admin/leads` 客户列表 + 状态管理
- [ ] `/admin/orders` 订单列表
- [ ] `/admin/activate` 激活工具
  - 根据 order 生成 credits
  - 发激活邮件

**合同准备**:
- [ ] e签宝企业账号开通
- [ ] 3 份合同模板（见 [payment-plan.md §2.4](payment-plan.md#24-合同管理)）
- [ ] 合同编号规则: `PONT-CONTRACT-YYYYMMDD-XXX`

**Week 1 出口**:
- [ ] 海外域名 `pontai.cloud` 可访问
- [ ] 可以完成 "注册 → 看到 50 credits → 填写意向 → CTO 收到通知 → 手工激活 → 用户账号多 200 credits" 全流程
- [ ] 3 份合同 Word 模板签字可用

---

### Week 2: OCR 工具（Part 1）

#### Day 1-2: 工具基础架构

- [ ] Provider 抽象层骨架
  - `lib/providers/ocr.ts`
  - `lib/providers/llm.ts`
  - `lib/providers/email.ts`
  - `lib/providers/payment.ts`
  - `lib/providers/storage.ts`
- [ ] 工具列表页 `/tools`
- [ ] OCR 工具页 `/tools/ocr-invoice` 布局
- [ ] 文件上传组件
  - Presigned URL 模式
  - 进度条
  - 大小限制 10MB
  - 格式限制 PDF/JPG/PNG

#### Day 3-4: OCR 执行流程

- [ ] DeepSeek OCR Provider 实现
- [ ] Anthropic Claude Provider 实现（后处理结构化）
- [ ] Inngest function: `tool.ocr-invoice`
  - Step 1: 读取 file（R2 Presigned GET）
  - Step 2: 调 DeepSeek OCR（失败自动重试 3 次）
  - Step 3: 调 Claude 结构化
  - Step 4: 写入 tool_runs + 调整 credits
  - Step 5: 失败时退 credits
- [ ] Prompt 目录 `prompts/ocr-invoice-v1.md`

#### Day 5: 前端体验

- [ ] 前端轮询任务状态（1s → 3s 退避）
- [ ] 结果展示页
  - 结构化字段表格
  - 原始 OCR 文本折叠
  - 下载 JSON 结果
- [ ] 失败处理
  - credits 退回
  - 友好错误提示

**Week 2 出口**: 能上传 PDF，60 秒内拿到结构化结果

---

### Week 3: OCR 验证 + 优化

- [ ] 准备 5 份真实 PDF 样本（你亲自收集）
- [ ] 每份标注期望输出字段
- [ ] 跑通 5 份，计算准确率
- [ ] Prompt 迭代至准确率 > 80%
- [ ] 案例整理（Week 5 做案例页用）

**Week 3 出口**: 5 份真实 PDF 准确率 > 80%

---

### Week 4: 拿下第一单（那位 2999 老板）

- [ ] 把 `pontai.cloud` 发给那位老板
- [ ] 给他开账号 + 100 credits 试用
- [ ] 让他用真实数据测试
- [ ] 收集反馈
- [ ] 发合同 → 对公转账 → 手动激活 2999 工具包
- [ ] 开发票发送给他

**Week 4 出口**: 第一笔真实付费 2999 入账

---

### Week 5: 案例库 + 试运营

- [ ] 整理前 1-2 单的案例
- [ ] `/cases` 列表页
- [ ] `/cases/[slug]` 详情页（MDX）
- [ ] 案例页 CTA "立即咨询"
- [ ] 朋友圈/微信群分享案例

---

### Week 6-7: 客户关系 + 迭代

- [ ] 主动联系 3-5 个潜在客户（你的关系网络）
- [ ] 邀请内测（送 100 credits）
- [ ] 收集反馈
- [ ] Prompt v2 基于真实反馈迭代
- [ ] UX 小修小补（根据客户问什么问最多）

---

### Week 8: 冲 10 单目标

- [ ] 目标: 8 个付费订单（前 4 周累计）
- [ ] 如果不达标，分析原因（产品问题？定价问题？转化问题？）
- [ ] 如果达标，准备进入 Stage 1

**Stage 0 出口标准**:
- ✅ 10 个付费订单
- ✅ 至少 2 个续费或加购
- ✅ OCR 准确率稳定 > 80%
- ✅ 客户 NPS > 7（每位主观打分 1-10）
- ✅ Provider 抽象层骨架完整，Stage 1/2 接入无需大改

---

## 第 1 阶段 (Stage 1): 海外自动化 + 扩展到 100 单

**时长**: 约 4 周（Month 2 后半段 - Month 3）
**投资**: +$75-100/月 + Stripe 手续费
**退出**: 100 个订单 + 月度自动化收款占比 > 50%

### Week 9-10: Stripe 集成

- [ ] Stripe 账号注册（企业账号）
- [ ] Stripe Products & Prices 配置三档套餐（含年付）
- [ ] `/api/stripe/checkout` 创建支付会话
- [ ] `/api/stripe/webhook` 接收 `checkout.session.completed` 事件
  - 验签
  - 幂等检查（event.id）
  - 写入 payment_events
  - 触发 Inngest 激活 function
- [ ] `/account/subscription` 客户订阅管理
- [ ] 对公转账路径保留（国内客户优先）

**实现要点**: 按 [payment-plan.md §5](payment-plan.md#五provider-抽象层设计) 的 Provider 接口实现 `StripeProvider`

### Week 11-12: SEO 工具 + 自建 Puppeteer

- [ ] Railway 新建 service `puppeteer-worker`（独立应用）
  - 基础镜像: `node:20-alpine` + `chromium` + `puppeteer-core`
  - Express + health check endpoint
  - 每 1000 请求或 24h 重启浏览器
- [ ] web service 通过 Railway 内网 DNS 调 puppeteer-worker
- [ ] `/tools/seo-audit` UI
- [ ] 抓取 + 规则引擎（title/meta/heading/vitals）
- [ ] Anthropic Claude 评估 + 3-5 条可执行建议
- [ ] PDF 报告导出（用 `@react-pdf/renderer`）
- [ ] Lead 钩子: 问题 > 3 项 → 弹"999 诊断"

**说明**: Stage 1 早期也可以继续用 Browserless（$30/月），等调用量起来再切自建，成本 $5-10/月 Railway service。

### Week 13+: 扩展

- [ ] Railway PG 升级（容量超 80% 触发）
- [ ] 邮件自动化流（欢迎 / credits 低余额 / 到期提醒，用 Inngest Cron 触发）
- [ ] `/cases` 补充到 5-10 个真实案例
- [ ] A/B 测试首页文案（自建 feature flag 或等需要时接分析服务）
- [ ] 海外推广初试（Product Hunt / Reddit / LinkedIn）

**Stage 1 出口标准**:
- ✅ 100 个付费订单累计
- ✅ 月度自动化收款占比 > 50%
- ✅ 2 个工具稳定在线
- ✅ 客户主动推荐出现

---

## 第 2 阶段 (Stage 2): 国内规模化 + 开课

**触发**: 国内客户 > 100/月 或准备发开课公告
**时长**: Month 3+
**投资**: +¥600-900/月阿里云 + 一次性公司认证 + 时间成本

### 前置准备（提前 20 工作日启动）

- [ ] 购买 `pontai.com` 域名（立即买，避免被抢）
- [ ] 阿里云企业实名认证
- [ ] `pontai.com` ICP 备案
- [ ] 微信支付商户号申请
- [ ] 支付宝开放平台认证
- [ ] 阿里云 AnalyticDB Supabase 开通（上海）
- [ ] 阿里云 SAE 开通
- [ ] 阿里云短信 + 邮件 + CDN + WAF

### 双轨部署

- [ ] 代码双轨化（`NEXT_PUBLIC_REGION` 环境变量驱动 Provider 路由）
- [ ] `pontai.cloud` 继续 Railway + Cloudflare + R2（海外）
- [ ] `pontai.com` 部署到阿里云 SAE + AnalyticDB Supabase + OSS（国内）
- [ ] Provider 抽象层新增阿里云实现（AliyunOssProvider / AliyunSmsProvider / VolcengineProvider 等）
- [ ] Better Auth 用户数据迁移到 Supabase Auth（阿里云版）
- [ ] 跨区用户数据迁移工具（按需）

### 支付闭环

- [ ] 微信支付 JSAPI + Native
- [ ] 支付宝当面付 + PC Web
- [ ] 三层保险（webhook + 前端兜底 + pg_cron）
- [ ] 发票系统自动化

详见 v2.0 roadmap M4 和 [payment-plan.md §4](payment-plan.md#四stage-2-加微信支付--支付宝国内规模化)。

### 课程功能

- [ ] `/courses` 课程列表
- [ ] 课程详情页
- [ ] 课程购买流程（微信支付 / 支付宝）
- [ ] 学员后台
- [ ] 课程内容 CMS（MDX）
- [ ] 社群引流（加企业微信 / 知识星球）

**Stage 2 出口标准**:
- ✅ 月单量稳定 > 300
- ✅ 2999 升级率 > 15%
- ✅ 首期课程完成（≥ 20 学员）
- ✅ 企业客户占比 > 50%

---

## 阶段切换的判断标准

**Stage 0 → Stage 1**（可以切，不强制）:
- 累计订单 ≥ 10
- OCR 稳定
- CTO 对产品方向有信心

**Stage 1 → Stage 2**（强制触发）:
- 国内客户请求微信支付的比例 > 30%
- 月度订单 ≥ 50
- 有开课/线下活动计划

---

## 仓库结构（Week 1 Day 1 建立）

```
pontai/
├── README.md
├── Dockerfile                          # Railway 部署用，Stage 2 切 SAE 复用
├── railway.toml                        # Railway 构建配置
├── docs/
│   ├── adr-001-supabase-alibaba.md     (归档)
│   ├── adr-002-global-first-mvp.md     (当前决策)
│   ├── stage-plan.md
│   ├── stage-2-aliyun-blueprint.md     (Stage 2 蓝图)
│   ├── aliyun-decisions.md
│   ├── payment-plan.md
│   ├── roadmap.md                      (本文档)
│   └── checklist.md
├── prompts/
│   ├── ocr-invoice-v1.md
│   └── seo-audit-v1.md
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   ├── page.tsx                # /
│   │   │   ├── pricing/page.tsx        # /pricing
│   │   │   ├── pricing/apply/page.tsx
│   │   │   └── cases/page.tsx
│   │   ├── (app)/
│   │   │   ├── account/page.tsx
│   │   │   ├── tools/page.tsx
│   │   │   └── tools/ocr-invoice/page.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   ├── leads/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   └── activate/page.tsx
│   │   └── api/
│   │       ├── auth/[...all]/route.ts  # Better Auth handler
│   │       ├── leads/route.ts
│   │       ├── upload/intent/route.ts  # R2 presigned URL 签发
│   │       ├── inngest/route.ts        # Inngest handler
│   │       └── webhooks/
│   │           └── stripe/route.ts     # Stage 1
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts               # Drizzle schema
│   │   │   └── index.ts                # DB client
│   │   ├── auth/
│   │   │   ├── server.ts               # Better Auth server
│   │   │   └── client.ts               # Better Auth client
│   │   ├── inngest/
│   │   │   ├── client.ts
│   │   │   └── functions/
│   │   │       ├── ocr-invoice.ts
│   │   │       └── crons/
│   │   │           └── cleanup-files.ts
│   │   ├── providers/
│   │   │   ├── types.ts                # 所有接口定义
│   │   │   ├── payment/
│   │   │   │   ├── bank-transfer.ts    # Stage 0 主力
│   │   │   │   ├── stripe.ts           # Stage 1
│   │   │   │   ├── wechat.ts           # Stage 2
│   │   │   │   └── alipay.ts           # Stage 2
│   │   │   ├── ocr/
│   │   │   │   ├── deepseek.ts
│   │   │   │   └── baidu.ts            # 兜底
│   │   │   ├── llm/
│   │   │   │   ├── anthropic.ts        # Stage 0 主力
│   │   │   │   ├── deepseek.ts
│   │   │   │   └── volcengine.ts       # Stage 2 国内
│   │   │   ├── email/
│   │   │   │   ├── resend.ts
│   │   │   │   └── aliyun-dm.ts        # Stage 2
│   │   │   ├── sms/
│   │   │   │   └── aliyun.ts           # Stage 2
│   │   │   └── storage/
│   │   │       ├── r2.ts               # Stage 0 主力
│   │   │       └── aliyun-oss.ts       # Stage 2
│   │   └── utils/
│   ├── components/
│   │   ├── ui/                         # Radix primitives 封装
│   │   └── features/
│   └── styles/
├── drizzle/                            # migration files
├── .env.local.example
├── drizzle.config.ts
├── next.config.mjs
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 每周节奏（Stage 0 期间）

**周一上午**: 同步上周完成度，确认本周最重要 3 件事
**周三**: 中期检查，阻塞问题升级处理
**周五下午**: 数据回顾（注册数 / lead 数 / 付费数），下周规划

**客户沟通节奏**:
- 每个付费客户至少每两周主动联系一次
- 新客户首周每 3 天一次主动跟进
- 问题响应: 工作日 4 小时内

---

## 关键风险登记

| 风险 | 阶段 | 影响 | 缓解 |
|------|------|------|------|
| CTO 精力不够同时开发+销售 | Stage 0 | 上线延期 | 兼职前端分担 UI 工作 |
| 那位 2999 老板最终没付款 | Stage 0 | 士气打击 | 不 all-in 单个客户，同时跟 3-5 个 |
| OCR 准确率上不去 80% | Stage 0 | 产品不可用 | 提前用测试集跑，Week 3 见分晓 |
| Railway PG 容量撞墙 | Stage 1 | 数据库降速 | 80% 容量升级 |
| Inngest 免费 tier 用光 | Stage 1 | 任务排队 | 超过 50k steps/月升 Pro |
| 国内客户要求微信支付 | Stage 1 | 转化损失 | 对公转账话术 + 合同专业度替代 |
| `.cloud` 备案被拒 | Stage 2 | 上线延期 | 提前买 `.com`，Stage 2 前确认 |
| 微信支付商户号审核慢 | Stage 2 | 切换延期 | 提前 20 工作日启动 |
| Better Auth → Supabase Auth 迁移 | Stage 2 | 用户体验断点 | 双轨运行期让用户过渡，手写数据迁移脚本 |
| 开课内容质量不达标 | Stage 2 | 退款潮 | 先 1 期小班测试，不搞大班 |

---

## 相关文档

- [ADR-002: 架构决策](adr-002-global-first-mvp.md)
- [stage-plan.md](stage-plan.md) - 三阶段详细规划
- [aliyun-decisions.md](aliyun-decisions.md) - 阿里云事项
- [payment-plan.md](payment-plan.md) - 支付体系
- [checklist.md](checklist.md) - 前置检查清单

---

## 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2026-04-23 | 初版 (v2.0 阿里云 M0-M5 路线) |
| 2.0 | 2026-04-23 | v2.0 阿里云版重写 |
| **3.0** | **2026-04-24** | **按 ADR-002 重组为 Stage 0/1/2，v2.0 作为 Stage 2 蓝图归档** |
