# ADR-001: 选择阿里云 Supabase 全家桶架构

**日期**: 2026-04-23  
**状态**: 已接受  
**决策**: 采用 Option B - 阿里云 Supabase 全家桶架构

---

## 背景

原 CTO 架构文档 (v1.1) 采用 Railway + Cloudflare + Inngest 架构，基于以下核心原则:
1. 能用 Postgres 解决的不引入新组件
2. 能用托管服务的不自建
3. 能延后的复杂度全部延后

但在 2026 年 4 月，以下新事实出现:
- **阿里云 AnalyticDB Supabase** 已于 2025.12.11 商业化
- 阿里云提供中国大陆部署的 Supabase 全托管服务
- 100% API 兼容官方 Supabase

这促使我们重新评估架构选择。

---

## 考虑的选项

### 选项 A: 保持原方案 (Railway + Cloudflare)

**优势**:
- 架构文档已完成，无需重写
- 成本最低 (~¥200/月)
- 团队熟悉

**劣势**:
- 数据跨境 (Railway Singapore + Cloudflare 美国)
- 2026 年中国 GFW 收紧，访问稳定性风险
- 企业客户对"海外部署"信任度低
- 合规风险 (数据出境)

### 选项 B: 阿里云 Supabase 全家桶 (被选中)

**优势**:
- 数据全在中国境内 (上海机房)
- 合规性强 (阿里云企业级认证)
- 原生支持微信 OAuth、支付宝
- 可宣传"国产合规"增强 B 端信任
- 阿里云生态一体化 (SAE + Supabase + CDN + 短信 + 邮件)

**劣势**:
- 成本更高 (~¥500-800/月 vs ¥200/月)
- 需重新评估异步任务方案 (Inngest → Edge Functions)
- 需 ICP 备案 (长尾 20 工作日)
- 架构文档需重写

### 选项 C: 混合方案 (Supabase 部分组件)

**考虑**: 只用 Supabase Storage + Auth，保留 Railway PG

**否决原因**:
- 跨机房通讯延迟 (Railway Singapore ↔ 阿里云大陆)
- 两套供应商，运维复杂度翻倍
- 数据分两地，一致性问题

---

## 决策

**选择 Option B: 阿里云 Supabase 全家桶**

理由:
1. **合规是底线**: 999 元收费的 B 端产品，企业客户会询问数据存储位置
2. **网络稳定性**: 国内机房避免 GFW 风险
3. **微信生态**: Supabase 阿里云版原生支持微信 OAuth
4. **成本可接受**: 每月多 ¥300-600 换取合规和信任，ROI 为正

---

## 影响

### 需重写的架构组件

| 组件 | 原方案 | 新方案 |
|------|--------|--------|
| 部署 | Railway | 阿里云 SAE |
| 数据库 | Railway PG | AnalyticDB Supabase |
| Auth | Lucia/Better Auth | Supabase Auth |
| 文件存储 | Cloudflare R2 | Supabase Storage |
| CDN | Cloudflare | 阿里云 CDN |
| 异步任务 | Inngest | Supabase Edge Functions |
| 邮件 | Resend | 阿里云邮件推送 |
| 监控 | Sentry + PostHog | 阿里云 SLS + 云监控 |

### 关键路径变动

**新增前置依赖**:
- ICP 备案 (20 工作日)
- 阿里云账号企业认证
- 域名备案确认 (`.cloud` 可能不支持)

---

## 相关文档

- [README.md](../README.md) - 架构总览
- [roadmap.md](roadmap.md) - 详细路线图
- [checklist.md](checklist.md) - 前置检查清单
