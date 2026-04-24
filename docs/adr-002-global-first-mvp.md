# ADR-002: 转向海外优先 MVP，暂缓阿里云全家桶架构

**日期**: 2026-04-24
**状态**: 已接受
**决策**: 暂停执行 v2.0 阿里云全家桶架构，转向 **Stage 0 海外优先过渡方案**；v2.0 架构作为 Stage 2 国内规模化蓝图归档保留
**作者**: CTO
**覆盖**: [ADR-001](adr-001-supabase-alibaba.md) 的决策前提

---

## 一、背景

### 1.1 上一版决策 (ADR-001, 2026-04-23)

ADR-001 基于以下前提决策了阿里云 Supabase 全家桶架构:

1. 国内 B 端市场为主
2. 合规性是企业客户的核心关切
3. 数据必须在中国境内
4. 微信生态原生支持
5. 企业客户"国产合规"信任加分

### 1.2 新事实 (2026-04-24 澄清)

24 小时后，客户画像和业务节奏重新澄清，上述前提**全部不成立**:

| 原前提 | 新事实 |
|-------|-------|
| 国内 B 端市场为主 | 当前站点 `pontai.cloud` 面向全球用户 |
| 流量来自冷启动 | 现有访问者主要是熟人和关系网络 |
| 规模化收费在即 | 国内付费客户是点状分布的老板（个位数到两位数） |
| 合规是上线前置 | 开课规模化是 Month 3+ 的计划 |
| 可接受 ¥500-800/月基础设施 | 前期希望投入最小化 |

### 1.3 触发决策的关键矛盾

按 v2.0 执行，前期要烧掉:

- 阿里云企业认证相关（推测 ¥1600 为销售捆绑套餐）
- 微信支付商户号保证金 + 服务费
- 阿里云 AnalyticDB Supabase + SAE ¥500-800/月
- ICP 备案阻塞 20 工作日上线
- 阿里云短信、邮件、CDN、WAF 等费用

**这些对当前真实付费客户（海外用户 + 少量熟人老板）的价值趋近于零。**

更严重的是，阿里云大陆机房部署对海外用户访问速度是**反向价值**。

---

## 二、考虑的选项

### 选项 A: 继续执行 v2.0 阿里云架构

**优势**:
- 文档完整，向 Stage 2 无需切换
- 提前为国内规模化做好基础设施

**劣势**:
- 一次性投入 ¥1600+ / 月度 ¥500-800
- ICP 备案 20 工作日阻塞上线
- 海外用户访问慢，产品体验反向
- 为未发生的规模做提前优化，违背精益原则

**结论**: 过度工程，**否决**

### 选项 B: Stage 0 海外优先过渡 (被选中)

**核心选型**: **Railway + Cloudflare + Inngest + R2 + Better Auth + Resend + DeepSeek/Anthropic**（继承 v1.1 基础盘，但砍掉 Sentry / PostHog / Google OAuth 等 Stage 0 用不到的）

**优势**:
- 月度基础设施成本 ~$25，零一次性投入
- 5 工作日内可上线
- v1.1 已验证的技术判断（避 Vercel Serverless 长进程、R2 零出口流量费、Inngest step functions）
- Cloudflare 全球 CDN 覆盖海外 + 国内熟人
- Railway 和 Stage 2 目标阿里云 SAE 都是 Docker 容器，Dockerfile 不变
- 国内大额客户用对公转账 + 电子合同完成收款，正规且合规

**劣势**:
- 需要维护 Stage 0/1/2 三阶段演进意识
- 开发纪律必须严格（6 条兼容性规矩，见 §5）
- Stage 2 切阿里云时 Auth (Better Auth → Supabase Auth)、Storage (R2 → OSS) 需要迁移工作
- 中期需要一次"双轨切换"（Month 3+）

**结论**: **选定**

### 选项 C: 直接从 Stage 0 跳 Stage 2 (双轨并行)

**优势**: 避免中间阶段切换

**劣势**:
- 过早承担 Stage 2 复杂度
- 丧失 Stage 0 的速度优势
- 违背"延迟复杂度"原则

**结论**: **否决**

---

## 三、决策

**采用选项 B: Stage 0 海外优先过渡方案，v2.0 阿里云全家桶作为 Stage 2 蓝图归档。**

理由:

1. **客户在哪里，架构去哪里** —— 当前付费客户以海外为主 + 国内点状老板，v2.0 的部署位置和客户位置错位
2. **延迟复杂度** —— 国内规模化是 Month 3+ 的假设，不是当下事实，不为假设中的规模预投资
3. **保留可演进性** —— Stage 0 选择的所有组件都与 Stage 2 目标架构 API 兼容，迁移是 O(配置) 而非 O(重写)
4. **正面应对大额收款** —— B 端 999/2999/36000 级别订单用对公转账 + 电子合同 + 发票，比微信支付链接更专业、更合规、更符合企业客户习惯

---

## 四、三阶段演进摘要

| 阶段 | 目标 | 核心架构 | 月成本 | 收款方式 | 时间窗口 |
|------|------|---------|--------|---------|---------|
| **Stage 0** | 验证产品 + 完成前 10 单 | Railway + Cloudflare + Inngest + R2 | ~$25 | **对公转账 + 电子合同** | 现在 - Month 2 |
| **Stage 1** | 海外自动化 + 扩展到前 100 单 | + Stripe + 自建 Puppeteer service | ~$75 | + Stripe（海外） | Month 2-3 |
| **Stage 2** | 国内规模化 + 开课启动 | + 阿里云双轨 (pontai.com) | +¥600/月 | + 微信支付 + 支付宝 | Month 3+ |

详细展开见 [stage-plan.md](stage-plan.md)。

---

## 五、迁移兼容性保证（死规矩）

为确保 Stage 2 迁移为 O(配置) 级工作量，Stage 0/1 必须遵守以下 6 条纪律:

| # | 规矩 | 违反的后果 |
|---|------|----------|
| 1 | 数据库**仅使用标准 PostgreSQL 语法**，不用 Railway PG 或 Supabase 专属特性 | Stage 2 切阿里云 AnalyticDB Supabase 时 schema 重写 |
| 2 | 所有外部供应商走 **Provider 抽象层**（payment / sms / email / llm / ocr / storage / auth） | 业务代码到处改 |
| 3 | 文件存储**使用 S3 兼容协议**（R2 / Supabase Storage / 阿里云 OSS 都兼容） | 上传/下载逻辑大改 |
| 4 | 认证统一使用 **Better Auth**（PG 后端），Stage 2 切 Supabase Auth 时写迁移脚本 | 用户数据迁移痛苦 |
| 5 | 所有供应商配置**通过环境变量注入**，不硬编码 URL/Key | Stage 2 双轨环境无法切换 |
| 6 | **Dockerfile + 标准 Next.js 构建**，不锁定 Railway 私有能力 | Stage 2 切阿里云 SAE 时需要改打包 |

**责任人**: CTO + 所有工程师 code review 时强制检查

---

## 六、需要作废/归档的 v2.0 决策

v2.0 的每一项决策对应的 Stage 0 替代方案（严格 v1.1 继承）和 Stage 2 恢复计划:

| v2.0 决策 | Stage 0 替代（v1.1 继承） | Stage 2 是否恢复 |
|----------|------------------------|----------------|
| 阿里云 SAE 部署 | **Railway** | ✅ Stage 2 国内域名用 SAE |
| 阿里云 AnalyticDB Supabase | **Railway PostgreSQL** | ✅ Stage 2 迁阿里云 AnalyticDB Supabase |
| 阿里云 CDN + WAF | **Cloudflare** | ✅ Stage 2 国内域名加阿里云 CDN |
| Supabase Edge Functions（阿里云版） | **Inngest** | 🟡 Stage 2 视合规要求决定是否切 pg_cron |
| Supabase Auth | **Better Auth** | ✅ Stage 2 手写迁移到 Supabase Auth（阿里云版） |
| Supabase Storage | **Cloudflare R2** | ✅ Stage 2 迁阿里云 OSS（S3 兼容无痛） |
| 阿里云短信 | 邮箱 OTP（海外友好） | ✅ Stage 2 国内用户加短信 |
| 阿里云邮件推送 DM | **Resend** | 🟡 Stage 2 可继续 Resend，也可换 |
| 微信支付商户号（M4） | **对公转账 + 电子合同** | ✅ Stage 2 必做 |
| 支付宝当面付（阶段2） | **对公转账** | ✅ Stage 2 必做 |
| ICP 备案（M0 前置） | Stage 0 不做 | ✅ Stage 2 必做（20 工作日） |
| 阿里云 SLS 日志 | **Railway Logs**（Stage 0 只留日志，错误监控延后）| ✅ Stage 2 再评估是否接 Sentry |
| 阿里云 ARMS 分析 | Stage 0 不做 | 🟡 Stage 2 有漏斗分析需求时再接（PostHog / Plausible） |
| 阿里云企业认证 | 不做 | ✅ Stage 2 必做 |
| 火山方舟 Claude | **Anthropic Claude（海外直连）** | ✅ Stage 2 国内切火山方舟 |

详细清单见 [aliyun-decisions.md](aliyun-decisions.md)。

---

## 七、影响评估

### 7.1 成本影响

| 维度 | v2.0 方案 | Stage 0 方案 | 节省 |
|------|----------|-------------|------|
| 前期一次性投入 | ¥1600+（企业认证） | ¥0 | ¥1600 |
| 月度基础设施 | ¥500-800 | < ¥150（$20） | ¥400-650/月 |
| 上线时间 | 20 工作日（ICP 备案阻塞） | 5 工作日 | 15 工作日 |
| 第一笔收款 | 7-15 工作日后（商户号审核） | 本周（对公转账） | 2-3 周 |

### 7.2 架构复杂度影响

- Stage 0 最小集（Railway + Cloudflare + Inngest + R2 + Better Auth + Resend + DeepSeek/Anthropic），砍掉 Sentry / PostHog / Google OAuth 等不紧迫的项
- 相比 v2.0 少 **6 个阿里云供应商**（SAE / AnalyticDB Supabase / CDN / WAF / 短信 / 邮件 DM）
- 开发纪律增加 6 条兼容性规矩
- 代码增加 Provider 抽象层（~500 行骨架代码）
- Dockerfile 标准化（为 Stage 2 切 SAE 铺路）

### 7.3 文档影响

**新增/更新为当前生效文档**:
- [README.md](../README.md) — 完全重写为 v3.0 (Railway + Cloudflare Stage 0)
- 本文件 [adr-002-global-first-mvp.md](adr-002-global-first-mvp.md)
- [stage-plan.md](stage-plan.md) — 三阶段详细路线
- [aliyun-decisions.md](aliyun-decisions.md) — 阿里云事项清单
- [payment-plan.md](payment-plan.md) — 支付体系规划
- [roadmap.md](roadmap.md) — Stage 0 Week 级路线
- [checklist.md](checklist.md) — Stage 0 前置清单

**归档**（作为 Stage 2 蓝图参考）:
- [stage-2-aliyun-blueprint.md](stage-2-aliyun-blueprint.md) — v2.0 阿里云方案完整内容
- [adr-001-supabase-alibaba.md](adr-001-supabase-alibaba.md) — v2.0 决策依据，保留

---

## 八、相关决策

- [ADR-001: 选择阿里云 Supabase 全家桶](adr-001-supabase-alibaba.md) — 本决策覆盖其前提，但其架构方案作为 Stage 2 蓝图保留

---

## 九、修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2026-04-24 | 初版，基于客户画像澄清后的重新推演（误选 Vercel + Supabase 全家桶） |
| 1.1 | 2026-04-24 | **纠正**: Stage 0 架构严格继承前 CTO v1.1（Railway + Cloudflare + Inngest + R2 + Better Auth），撤销 Vercel 和 Supabase 全家桶选型 |
