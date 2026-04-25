# 认证流程设计（2026-04-25 落地）

**状态**: 已实现，等待第一次 e2e 验证（你来跑）
**替代**: 之前的 邮箱 OTP 单一登录 + Google OAuth 预留 → 全部移除

---

## 一、为什么改

老板第一单是国内中小企业，他们对认证的预期是：
1. **手机号验证码注册**（这是国内 SaaS 的标配，没有就觉得不专业）
2. **手机号 + 密码登录**（每次登录都要验证码 = 摩擦太大）
3. 邮箱用来收发票 / 合同（不是登录手段）

所以这一版彻底转向：**手机号是主身份，邮箱是收件地址，密码是日常登录手段**。

---

## 二、流程总览

### 2.1 注册（/register）— 2 步向导

```
[Stage 1] 手机号验证
   ┌────────────────────────────────┐
   │ 输入: 13800138000              │
   │ 点 [获取验证码] → 后端发 OTP   │
   │ 输入: 6 位短信码               │
   │ 点 [下一步]                    │
   └────────────────────────────────┘
                 │
                 ▼
[Stage 2] 完善账号信息
   ┌────────────────────────────────┐
   │ 姓名 *                          │
   │ 公司名（可选）                  │
   │ 邮箱 *                          │
   │ 密码 * (至少 8 位)              │
   │ 确认密码 *                      │
   │ 点 [完成注册] → 创建账号 + 登录 │
   └────────────────────────────────┘
                 │
                 ▼
            /account
            （自动到账 50 credits）
```

**关键设计点**：
- Stage 1 不立即调 `verifyPhoneNumber` — 因为验证完后 Better Auth 会删除 OTP 记录，再到 Stage 2 提交时就找不到了。
- 我们自己写了一个 `POST /api/auth/sms/register` 端点，**把 OTP 校验和 sign-up 合并成一次**，避免 race。
- 该端点先校验 OTP（直接读 `verifications` 表），通过后调 `auth.api.signUpEmail()`，最后用 Drizzle 直接把 `phoneNumber` + `phoneNumberVerified=true` 写到 user 上。
- OTP 有效期 10 分钟（普通短信验证码标准是 5 分钟，但我们多给 5 分钟，因为客户填邮箱密码可能需要时间）。

---

### 2.2 登录（/login）— Tab 切换

```
   ┌─────────────┬─────────────┐
   │ 手机号 [✓]  │ 邮箱        │
   ├─────────────┴─────────────┤
   │ 手机号: 13800138000        │
   │ 密码:   ●●●●●●●●          │
   │ [登录]                     │
   │                            │
   │ 忘记密码?    立即注册       │
   └────────────────────────────┘
```

- 默认 Tab 是 **手机号 + 密码**（最国内化）
- 备用 Tab 是 **邮箱 + 密码**（给被动激活的老板留入口）
- 两条都走 Better Auth：手机号路径用 `signIn.phoneNumber`，邮箱路径用 `signIn.email`。

---

### 2.3 忘记密码（/forgot-password → /reset-password）

```
   /forgot-password
   ┌─────────────┬─────────────┐
   │ 手机号 [✓]  │ 邮箱        │
   ├─────────────┴─────────────┤
   │ 路径 A: 手机号 + SMS 验证码 │
   │   → 直接在本页设新密码      │
   │   → 跳转 /login             │
   │                              │
   │ 路径 B: 邮箱                 │
   │   → 发一条「设置密码」邮件   │
   │   → 客户点链接到 /reset-pwd  │
   │   → 在 /reset-pwd 设新密码   │
   │   → 跳转 /login             │
   └─────────────────────────────┘
```

- 路径 A 用 Better Auth 的 `phoneNumber.requestPasswordReset` + `phoneNumber.resetPassword`
- 路径 B 用 Better Auth 的 `requestPasswordReset` + `resetPassword`（带 token）
- 两条路径都不会泄露「这个手机号/邮箱是否注册过」（防枚举）

---

### 2.4 管理员激活流程的衔接

老板走 `/pricing/apply` 提交意向 → 你审批 → 客户签合同 → 打款 → 你激活：

```
你点「激活」
   │
   ▼
activate.ts 自动:
   1. 查 leads.email 对应的 user
   2. 找不到 → 用 lead 的信息建一个 user（不写 phoneNumber！）
   3. 发 credits + 发票
   4. 发激活邮件 + 自动调 requestPasswordReset
                                  │
                                  ▼
                         客户邮箱收到 2 封邮件:
                            (a) 激活成功 + 发票 PDF
                            (b) 设置登录密码
                         客户点 (b) → /reset-password?token=xxx
                                   → 设密码 → 用「邮箱+密码」登录
                                   → 想用手机号登录? 进「我的账户」绑手机
```

**为什么 activate.ts 不写 phoneNumber**：
`phoneNumber` 字段在 DB 里是 `unique`，如果两个 lead 共用同一个手机号（夫妻店、代理人）会冲突。所以激活流程**只写邮箱**，让客户后续自己绑定手机号（带 SMS 验证）。

---

## 三、技术栈与文件结构

### 3.1 改动的依赖

无新增依赖。沿用 `better-auth@1.6.9`，启用之前没用的两个 feature：
- `emailAndPassword: { enabled: true }` — 之前是 `false`
- `phoneNumber()` 插件 — 之前没装

### 3.2 新增 / 修改的文件

| 路径 | 作用 |
|------|------|
| `src/lib/db/schema.ts` | users 表移除 `phone`，加 `phone_number` (unique) + `phone_number_verified` |
| `src/lib/auth/server.ts` | 启用 email+password，加 phoneNumber 插件，配 sendResetPassword + databaseHooks（admin 自动晋升 + welcome credits）|
| `src/lib/auth/client.ts` | 加 `phoneNumberClient` |
| `src/lib/auth/phone.ts` | 新建。中国大陆手机号校验/规范化/掩码工具 |
| `src/lib/providers/sms/types.ts` | 新建。`ISmsProvider` 接口 |
| `src/lib/providers/sms/stub.ts` | 新建。控制台打印 + dev 模式回显 OTP |
| `src/lib/providers/sms/index.ts` | 新建。Provider 工厂 + dev 调试缓存 |
| `src/app/api/auth/sms/register/route.ts` | 新建。OTP 校验 + signUpEmail 一站式注册 |
| `src/app/api/auth/sms/debug-peek/route.ts` | 新建。仅 dev + stub 模式开放，让前端自动显示 OTP |
| `src/app/(marketing)/register/page.tsx` | 新建。2 步向导 |
| `src/app/(marketing)/login/page.tsx` | 重写。Tab 切换的手机号/邮箱登录 |
| `src/app/(marketing)/forgot-password/page.tsx` | 新建。Tab 切换的手机号/邮箱重置 |
| `src/app/(marketing)/reset-password/page.tsx` | 新建。处理邮件链接里的 token |
| `src/app/(marketing)/layout.tsx` | 加「注册」按钮 |
| `src/app/(marketing)/pricing/apply/page.tsx` | prefill 改读 `phoneNumber` |
| `src/lib/orders/activate.ts` | 不写 phoneNumber，激活后自动发设置密码邮件 |
| `src/lib/providers/email/templates.ts` | 移除 `otpEmail`，加 `passwordResetEmail`（给两个场景共用）|
| `src/lib/env.ts` | 加 `SMS_PROVIDER` + 阿里云占位字段；空字符串当 undefined |
| `.env.local.example` | 更新 |

---

## 四、SMS Provider — 当前是 Stub

### 4.1 Stub 模式做了什么

`SMS_PROVIDER=stub`（默认）时：
1. 控制台打印一个高亮 banner：
   ```
   ════════════════════════════════════════════════════════════
     [SMS STUB] phone=+8613800138000  purpose=register
     [SMS STUB] code=123456
     [SMS STUB] (10 min validity, no real SMS sent)
   ════════════════════════════════════════════════════════════
   ```
2. 同时把 `(phoneNumber, code)` 缓存在内存（10 分钟过期）
3. **dev 模式 + stub 模式**下，前端调 `GET /api/auth/sms/debug-peek?phone=...` 拿回 code
4. 注册/忘记密码页面会显示一个琥珀色提示框：「开发模式：验证码 123456 — 直接复制使用」

**生产模式 (`NODE_ENV=production`) 一律不暴露 OTP**，即使配的是 stub —— `debug-peek` 端点直接返 404。

### 4.2 切到真实 provider 怎么做

阿里云短信为例，未来切的时候要改 3 个地方：

1. **新建 `src/lib/providers/sms/aliyun.ts`** 实现 `ISmsProvider`：
   ```ts
   export class AliyunSmsProvider implements ISmsProvider {
     readonly name = 'aliyun';
     async send({ phoneNumber, code, purpose }) {
       const templateCode = purpose === 'reset_password'
         ? process.env.ALIYUN_SMS_TEMPLATE_CODE_RESET
         : process.env.ALIYUN_SMS_TEMPLATE_CODE_REGISTER;
       // 调阿里云 SDK ...
       return { providerMessageId: bizId };
     }
   }
   ```
2. **`src/lib/providers/sms/index.ts`** 加一行 case：
   ```ts
   case 'aliyun':
     return new AliyunSmsProvider();
   ```
3. **`.env.local` / Railway 变量**：
   ```
   SMS_PROVIDER=aliyun
   ALIYUN_SMS_ACCESS_KEY_ID=...
   ALIYUN_SMS_ACCESS_KEY_SECRET=...
   ALIYUN_SMS_SIGN_NAME=...
   ALIYUN_SMS_TEMPLATE_CODE_REGISTER=...
   ALIYUN_SMS_TEMPLATE_CODE_RESET=...
   ```

不需要改任何业务代码或 UI。

### 4.3 阿里云 vs 腾讯云 vs Supabase Phone Auth

| 选项 | 优势 | 劣势 | 单价参考 |
|------|------|------|---------|
| 阿里云短信 | 国内最常用，文档完善 | 签名 + 模板要审核 1-3 天 | ¥0.045/条 |
| 腾讯云短信 | 同档次 | 同样要审核 | ¥0.045/条 |
| Supabase Phone | 全球可用，自带 OAuth 和数据存储 | 需要把整个 auth 迁过去 | 按 MAU 计费 |
| Twilio | 国际客户友好 | 国内号难审核，价格 5-10x | ~$0.075/条 |

**我的建议**：第一单跑通后再选阿里云或腾讯云。Supabase Phone 不推荐 — 我们 auth 已经用 Better Auth + Drizzle + Railway PG，迁移成本高，**且** Supabase Phone 实质上还是接 Twilio/MessageBird，国内号要等待审核，没解决核心问题。

---

## 五、安全与限频

| 风险 | 应对 |
|------|------|
| 短信轰炸（机器人刷接口烧钱）| Better Auth phone-number 插件自带 rate limit：`/phone-number/*` 每 IP 60 秒最多 10 次 |
| OTP 暴力破解 | 同一手机号同一 OTP 最多 5 次错误尝试，超过自动作废 |
| 撞库（已知邮箱列表 + 弱密码）| `minPasswordLength: 8`；建议老板用 ≥ 12 位密码 |
| 邮箱 / 手机号枚举 | `requestPasswordReset` 不区分「找到」和「找不到」，统一返回成功 |
| Session 被窃取 | session 存在 HTTP-Only cookie，30 天过期，每天滑动续期 |
| 弱密码 | 当前只校验长度。Stage 1 可以加 zxcvbn 复杂度检查 |

---

## 六、本地测试清单（你跑这个）

### 6.1 准备工作（零依赖：不需要 Docker / Postgres / pnpm）

本地 dev 默认用 **PGlite**（嵌入式 WASM Postgres）作为数据库。`.env.local` 已经默认 `DATABASE_URL=pglite://./.local.pgdata`，schema 会在 dev server 第一次启动时自动应用，无需手动 `db:push`。

```bash
# 直接起 dev server（如果你装了 pnpm）
pnpm dev

# 或者用裸 node + 项目内 next CLI（不依赖 pnpm）
node node_modules/next/dist/bin/next dev
```

启动后看到这两行就说明数据库就绪：
```
[db] using PGlite (./.local.pgdata)
[db] applied 1 migration file(s) to PGlite
✓ Ready in ...
```

> **想换真实 Postgres？** 把 `.env.local` 里的 `DATABASE_URL` 改成 `postgres://...` 即可。代码会自动切到 postgres-js 驱动，行为一致。
>
> **想完全清空 dev 数据库？** `rm -rf .local.pgdata`，下次启动会重新应用 schema。

### 6.2 跑通 3 条路径

#### 路径 1: 自助注册（最重要）

1. 浏览器开 http://localhost:3000/register
2. 输入手机号 `13800138000` → 点「获取验证码」
3. 0.3-1.5 秒后看到一个琥珀色提示框「开发模式：验证码 ABCDEF — 直接复制使用」
4. 同时 dev server 控制台会打印：
   ```
   ════════════════════════════════════════════════════════════
     [SMS STUB] phone=+8613800138000  purpose=register
     [SMS STUB] code=123456
   ════════════════════════════════════════════════════════════
   ```
5. 把验证码填到 OTP 输入框，点「下一步」
6. Stage 2: 填姓名「张老板」、公司「样本科技」、邮箱 `[email protected]`、密码 `password123`、确认密码
7. 点「完成注册」→ 应该跳到 `/account`，看到「当前余额 50 credits」「累计获得 50」

#### 路径 2: 用刚注册的账号重新登录

1. 点右上角邮箱 → 「退出」
2. 进 http://localhost:3000/login
3. 用 **手机号 Tab**：`13800138000` + `password123` → 点登录 → 进 /account
4. 退出再来一次，用 **邮箱 Tab**：`[email protected]` + `password123` → 点登录 → 进 /account

#### 路径 3: 忘记密码（手机号路径）

1. 退出，进 http://localhost:3000/forgot-password
2. **手机号 Tab**：输入 `13800138000` → 点「获取验证码」
3. 看琥珀色提示框拿验证码
4. 填验证码 + 新密码 `newpass123` × 2 → 点「重置密码」
5. 跳转到 /login → 用 `13800138000` + `newpass123` 登录 → 成功

### 6.3 已经做过的 e2e 验证（自动化）

我把整条链路用脚本跑了一遍，这些是已经确认通过的：
- `POST /api/auth/phone-number/send-otp` → 200
- `GET /api/auth/sms/debug-peek?phone=...` → 返回 OTP（仅 dev 模式）
- `POST /api/auth/sms/register` → 200，写入 user/account/session/credit_balances，下发 cookie
- `POST /api/auth/sign-in/phone-number` → 200，下发 cookie
- `POST /api/auth/sign-in/email` → 200，下发 cookie
- 错误密码 → 401
- `POST /api/auth/phone-number/request-password-reset` → 200，控制台打印 reset OTP

DB 内验证（PGlite）后看到：
- 1 行 user，phone_number_verified=true，company_name=填的公司名
- 1 行 account（providerId='credential'，password=哈希）
- 1 行 session
- 1 行 credit_balances（available_credits=50, total_granted=50）
- 1 行 credit_transactions（type='grant', reason='注册赠送'）

### 6.3 顺手验证

- [ ] 手机号格式校验：输入「12345678901」（不是有效手机段）应该报错
- [ ] OTP 错误：故意输错验证码，应该提示「验证码不正确」
- [ ] 重复手机号：用同一手机号再注册一次，应该提示「该手机号已注册」
- [ ] 重复邮箱：用同一邮箱再注册一次，应该报错（Better Auth 内置的）
- [ ] 弱密码：填 `1234567`（7 位）应该被拦下
- [ ] 已登录访问 /login：用脚下 router.refresh() 测一下应该不会乱

如果以上 3 条路径 + 验证项全部跑通，认证流程就 OK 了。

---

## 七、修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1 | 2026-04-25 | 初版。从邮箱 OTP 全面切到「手机号 + 密码 + 邮箱」三件套；预留 SMS provider 抽象，Stage 0 用 stub |
