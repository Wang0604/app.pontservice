/**
 * 中国大陆手机号工具：
 *  - 输入接受 13800138000 / +8613800138000 / 138 0013 8000 等多种格式
 *  - 内部存储统一使用 +86 前缀的 E.164 格式（+8613800138000）
 *  - 校验规则：第二位必须是 1，且第三位 3-9（覆盖 130-199 段）
 */

const CN_MOBILE_REGEX = /^1[3-9]\d{9}$/;

/**
 * 把任意用户输入规范化为 E.164 格式。失败返回 null。
 */
export function normalizeCnPhoneNumber(input: string | null | undefined): string | null {
  if (!input) return null;
  const stripped = input.replace(/[\s\-()]/g, '');
  let digits = stripped;
  if (digits.startsWith('+86')) digits = digits.slice(3);
  else if (digits.startsWith('86') && digits.length === 13) digits = digits.slice(2);
  else if (digits.startsWith('0086')) digits = digits.slice(4);
  if (!CN_MOBILE_REGEX.test(digits)) return null;
  return `+86${digits}`;
}

export function isValidCnPhoneNumber(input: string | null | undefined): boolean {
  return normalizeCnPhoneNumber(input) !== null;
}

/**
 * 展示用：去掉 +86 前缀，便于在 UI 上以 11 位显示。
 */
export function formatCnPhoneForDisplay(e164: string | null | undefined): string {
  if (!e164) return '';
  if (e164.startsWith('+86')) return e164.slice(3);
  return e164;
}

/**
 * 用 `***` 屏蔽中段（138****8000），用于在通知和日志中减少 PII 风险。
 */
export function maskCnPhone(e164: string | null | undefined): string {
  const display = formatCnPhoneForDisplay(e164);
  if (display.length !== 11) return display;
  return `${display.slice(0, 3)}****${display.slice(7)}`;
}
