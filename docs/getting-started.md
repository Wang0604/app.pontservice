# Pontai 本地开发与部署指南

> 面向 CTO / 工程师，带你从零跑通 Stage 0 项目。
> 架构决策见 [README.md](../README.md)，前置清单见 [checklist.md](checklist.md)。

---

## 1. 前置要求

- Node.js 20+
- pnpm 9+（项目通过 `package.json` 的 `packageManager` 字段锁定为 9.15.4；运行 `corepack enable` 后，在项目目录下执行 `pnpm` 会自动切到 9.15.4，和 Dockerfile 完全一致）
- Docker Desktop（用于本地验证镜像构建）
- 一个 PostgreSQL 实例（本地 Docker 或 Railway 托管均可）

---

## 2. 首次本地启动

```bash
# 1. 安装依赖
pnpm install

# 2. 复制环境变量模板
cp .env.local.example .env.local
# 然后用编辑器填入真实值（至少 DATABASE_URL 和 BETTER_AUTH_SECRET）

# 3. 生成 Better Auth secret
openssl rand -base64 32

# 4. 启动本地 PostgreSQL（如果没有）
docker run -d --name pontai-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pontai \
  -p 5432:5432 \
  postgres:16-alpine

# 5. 跑数据库迁移
pnpm db:push

# 6. 填充测试数据（可选）
pnpm db:seed

# 7. 启动开发服务器
pnpm dev
```

打开 http://localhost:3000 应该能看到首页。
打开 http://localhost:3000/api/health 应该返回 `{"status":"ok",...}`。

---

## 3. Railway 部署

### 3.1 首次部署

1. 登录 https://railway.app，GitHub 授权
2. 新建 Project，选择 "Deploy from GitHub repo" 选中本仓库
3. 添加 PostgreSQL plugin：右侧 "+ New" → "Database" → "Add PostgreSQL"
4. Railway 会自动把 `DATABASE_URL` 注入到 web service 环境变量
5. 在 Settings → Variables 里添加其他必需环境变量（参考 `.env.local.example`）
6. 在 Settings → Networking 里点 "Generate Domain"，拿到一个 `*.up.railway.app` 域名

### 3.2 自定义域名（Cloudflare）

1. 在 Railway Settings → Networking → Custom Domain 添加 `pontai.cloud`
2. Railway 给出一个目标 CNAME（如 `xxx.up.railway.app`）
3. 在 Cloudflare DNS 控制台添加记录：
   - Type: `CNAME`
   - Name: `pontai.cloud`（或 `@`）
   - Content: Railway 提供的 CNAME
   - Proxy status: 橙色云（Proxied）
4. Cloudflare SSL/TLS 模式选 "Full"（Railway 终止 HTTPS）
5. 等 DNS 生效（1-5 分钟），访问 https://pontai.cloud 应该看到首页

### 3.3 Healthcheck

Railway 会自动调用 `/api/health` 判断服务健康度，见 `railway.toml`。

---

## 4. 常用命令

```bash
pnpm dev              # 本地开发服务器
pnpm build            # 生产构建
pnpm start            # 生产模式运行
pnpm lint             # ESLint
pnpm typecheck        # TypeScript 类型检查
pnpm format           # Prettier 格式化

pnpm db:generate      # 根据 schema.ts 生成 SQL migration
pnpm db:push          # 直接推 schema 到 DB（开发用，跳过 migration 文件）
pnpm db:migrate       # 应用 drizzle/*.sql migration
pnpm db:studio        # 启动 Drizzle Studio（浏览器里看 DB）
pnpm db:seed          # 填充测试数据
```

---

## 5. 本地 Docker 构建验证

```bash
docker build -t pontai:local .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgres://host.docker.internal:5432/pontai" \
  -e NODE_ENV=production \
  pontai:local
```

如果本地能跑通，Railway 上基本也能跑通。

---

## 6. 部署前置 Checklist

部署 Stage 0 到 Railway 之前，确保已经注册好并配置：

- [ ] Railway 账号 + project + PostgreSQL plugin
- [ ] Cloudflare 账号 + `pontai.cloud` 域名托管
- [ ] Cloudflare R2 bucket + API token（文件存储）
- [ ] Inngest app + event key / signing key（异步任务）
- [ ] Resend API key + 域名验证（邮件）
- [ ] DeepSeek API key（OCR + LLM 备用）
- [ ] Anthropic API key（Claude 主力 LLM）

详见 [checklist.md](checklist.md) §P1。

---

## 7. 故障排查

### 问题：`pnpm install` 失败
- 检查 Node 版本 `node -v` 是否 >= 20
- 如果是 M1/M2 Mac，确保 Docker 镜像用的是 arm64

### 问题：`pnpm db:push` 报错 "connection refused"
- 确认 PostgreSQL 已经启动：`docker ps | grep pontai-pg`
- 确认 `DATABASE_URL` 里的端口和用户名正确

### 问题：Railway 部署后 502
- 查看 Railway Logs，最常见是 `DATABASE_URL` 未设置
- 确认 healthcheck 路径 `/api/health` 返回 200

---

## 相关文档

- [README.md](../README.md) - 架构总览
- [adr-002-global-first-mvp.md](adr-002-global-first-mvp.md) - 架构决策
- [stage-plan.md](stage-plan.md) - 三阶段路线
- [payment-plan.md](payment-plan.md) - 收款流程
- [roadmap.md](roadmap.md) - Week 级开发路线
- [checklist.md](checklist.md) - 前置清单
