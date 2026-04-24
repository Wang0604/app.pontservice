/**
 * Email templates (HTML).
 * Keep simple inline-styled HTML for broad mail client compatibility.
 */

const BASE_STYLE = `
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  line-height: 1.6;
  color: #1a1a1a;
  max-width: 560px;
  margin: 0 auto;
  padding: 24px;
`;

const BUTTON_STYLE = `
  display: inline-block;
  padding: 12px 24px;
  background-color: #1a1a1a;
  color: #ffffff !important;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
`;

export function otpEmail(params: { otp: string; appName?: string }): { subject: string; html: string } {
  const appName = params.appName ?? 'Pontai';
  return {
    subject: `${appName} 验证码: ${params.otp}`,
    html: `
      <div style="${BASE_STYLE}">
        <h2>${appName} 登录验证码</h2>
        <p>您的验证码是：</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 24px 0; padding: 16px; background-color: #f5f5f5; border-radius: 8px; text-align: center;">
          ${params.otp}
        </div>
        <p>验证码 10 分钟内有效。如果不是您本人操作，请忽略此邮件。</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
        <p style="color: #666; font-size: 14px;">${appName} · 为实业服务</p>
      </div>
    `,
  };
}

export function leadNotificationEmail(params: {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string | null;
  interestedPlan: string;
  useCase?: string | null;
  leadUrl: string;
}): { subject: string; html: string } {
  const planLabel = { '999': '999 咨询', '2999': '2999 OCR 工具包', '36000': '36000 年付全包' }[
    params.interestedPlan
  ] ?? params.interestedPlan;

  return {
    subject: `[新申请] ${params.companyName} - ${planLabel}`,
    html: `
      <div style="${BASE_STYLE}">
        <h2>收到新申请</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; background: #f5f5f5;"><strong>公司</strong></td><td style="padding: 8px;">${params.companyName}</td></tr>
          <tr><td style="padding: 8px; background: #f5f5f5;"><strong>联系人</strong></td><td style="padding: 8px;">${params.contactName}</td></tr>
          <tr><td style="padding: 8px; background: #f5f5f5;"><strong>邮箱</strong></td><td style="padding: 8px;">${params.email}</td></tr>
          <tr><td style="padding: 8px; background: #f5f5f5;"><strong>电话</strong></td><td style="padding: 8px;">${params.phone ?? '未填'}</td></tr>
          <tr><td style="padding: 8px; background: #f5f5f5;"><strong>意向套餐</strong></td><td style="padding: 8px;">${planLabel}</td></tr>
          <tr><td style="padding: 8px; background: #f5f5f5;"><strong>使用场景</strong></td><td style="padding: 8px;">${params.useCase ?? '未填'}</td></tr>
        </table>
        <p><a href="${params.leadUrl}" style="${BUTTON_STYLE}">去 Admin 审批</a></p>
      </div>
    `,
  };
}

export function contractReadyEmail(params: {
  companyName: string;
  contractUrl: string;
  planLabel: string;
}): { subject: string; html: string } {
  return {
    subject: `您的合同已生成 - ${params.planLabel}`,
    html: `
      <div style="${BASE_STYLE}">
        <h2>您好，${params.companyName}</h2>
        <p>感谢您选择 Pontai。您申请的 <strong>${params.planLabel}</strong> 合同已经生成，请点击下方链接在线查看并签署：</p>
        <p style="margin: 24px 0;">
          <a href="${params.contractUrl}" style="${BUTTON_STYLE}">查看并签署合同</a>
        </p>
        <p>合同链接长期有效，但建议尽快签署以避免价格调整（尤其是早鸟价客户）。</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
        <p style="color: #666; font-size: 14px;">Pontai · 如有疑问回复此邮件即可</p>
      </div>
    `,
  };
}

export function paymentInstructionEmail(params: {
  companyName: string;
  orderNumber: string;
  amountCny: string;
  orderUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `合同已签署，请完成打款 - 订单 ${params.orderNumber}`,
    html: `
      <div style="${BASE_STYLE}">
        <h2>${params.companyName}，合同签署成功</h2>
        <p>您的订单 <strong>${params.orderNumber}</strong> 合同已生效，金额 <strong>¥${params.amountCny}</strong>。</p>
        <p>请登录订单页面查看对公账户信息并完成打款，备注请填写订单号：</p>
        <p style="margin: 24px 0;">
          <a href="${params.orderUrl}" style="${BUTTON_STYLE}">查看打款说明</a>
        </p>
        <p>我们收到打款后会在 1 个工作日内为您激活账号。</p>
      </div>
    `,
  };
}

export function activationEmail(params: {
  companyName: string;
  orderNumber: string;
  creditsGranted: number;
  loginUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `账号已激活，立即开始使用 - 订单 ${params.orderNumber}`,
    html: `
      <div style="${BASE_STYLE}">
        <h2>${params.companyName}，账号激活成功</h2>
        <p>您的订单 <strong>${params.orderNumber}</strong> 已激活。</p>
        <p><strong>${params.creditsGranted}</strong> credits 已到账，发票 PDF 附件请查收。</p>
        <p style="margin: 24px 0;">
          <a href="${params.loginUrl}" style="${BUTTON_STYLE}">登录开始使用</a>
        </p>
      </div>
    `,
  };
}
