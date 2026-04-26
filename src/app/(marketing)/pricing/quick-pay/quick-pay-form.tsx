'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const ENTRY_PRICE = 999;
const MONTHLY_PRICE = 2999;
const YEARLY_THRESHOLD = 12;

type PlanChoice = '999' | '2999';

const formSchema = z.object({
  companyName: z.string().min(2, '公司名至少 2 个字'),
  contactName: z.string().min(1, '请填联系人姓名'),
  email: z.string().email('邮箱格式不对'),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type FormInput = z.infer<typeof formSchema>;

interface Prefill {
  email?: string;
  name?: string;
  companyName?: string;
  phone?: string;
}

export function QuickPayForm({ prefill }: { prefill?: Prefill }) {
  const router = useRouter();
  const [planType, setPlanType] = useState<PlanChoice>('2999');
  const [monthCount, setMonthCount] = useState<number>(12);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needLoginUrl, setNeedLoginUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: prefill?.companyName ?? '',
      contactName: prefill?.name ?? '',
      email: prefill?.email ?? '',
      phone: prefill?.phone ?? '',
      notes: '',
    },
  });

  const isYearly = planType === '2999' && monthCount >= YEARLY_THRESHOLD;
  const totalAmount = useMemo(() => {
    if (planType === '999') return ENTRY_PRICE;
    return MONTHLY_PRICE * monthCount;
  }, [planType, monthCount]);

  async function onSubmit(data: FormInput) {
    setError(null);
    setNeedLoginUrl(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout/quick-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: data.companyName,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          planType,
          monthCount: planType === '999' ? 1 : monthCount,
          notes: data.notes,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        paymentPageUrl?: string;
        error?: string;
        needLogin?: boolean;
        loginUrl?: string;
      };
      if (!res.ok || !body.ok || !body.paymentPageUrl) {
        if (body.needLogin && body.loginUrl) setNeedLoginUrl(body.loginUrl);
        throw new Error(body.error ?? '提交失败，请稍后再试');
      }
      router.push(body.paymentPageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
      <div className="space-y-4">
        <Label className="text-base font-bold leading-[1.7] text-slate-900">
          1. 选择套餐
        </Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <PlanCard
            checked={planType === '999'}
            onClick={() => setPlanType('999')}
            title="999 启动包"
            tagline="一次性付费"
            price={`¥${ENTRY_PRICE.toLocaleString()}`}
            note="含 40-60 分钟免费 1v1 诊断、《AI 落地路线图》PDF 与 50 credits 工具体验。后续升级时金额全额抵扣首期。"
            disabled={submitting}
            accent="sky"
          />
          <PlanCard
            checked={planType === '2999'}
            onClick={() => setPlanType('2999')}
            title="2999 工具包"
            tagline="按月订阅"
            price={`¥${MONTHLY_PRICE.toLocaleString()} / 月`}
            note="完整 AI 工具矩阵：OCR 发票识别、SEO 诊断、GEO 诊断。选择 12 个月（包年）后，Credits 用量在订阅期内不设上限。"
            disabled={submitting}
            accent="amber"
          />
        </div>
      </div>

      {planType === '2999' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <Label className="text-base font-bold leading-[1.7] text-slate-900">
            2. 选择订阅周期
          </Label>
          <p className="text-sm leading-[1.95] text-slate-500">
            1–11 个月按 ¥{MONTHLY_PRICE.toLocaleString()} / 月计费；选择 12 个月（包年）订阅期内 Credits 用量不设上限。
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
              const checked = monthCount === n;
              const yearly = n >= YEARLY_THRESHOLD;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMonthCount(n)}
                  disabled={submitting}
                  className={
                    checked
                      ? yearly
                        ? 'rounded-xl border-2 border-amber-500 bg-amber-50 px-2.5 py-2.5 text-sm font-bold text-amber-900 transition'
                        : 'rounded-xl border-2 border-[#070b1c] bg-[#070b1c] px-2.5 py-2.5 text-sm font-bold text-white transition'
                      : 'rounded-xl border-2 border-slate-200 bg-white px-2.5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300'
                  }
                >
                  {n} 月
                  {n === 12 && (
                    <span
                      className={
                        checked
                          ? 'ml-1 text-[10px] font-black uppercase tracking-wide'
                          : 'ml-1 text-[10px] font-black uppercase tracking-wide text-amber-600'
                      }
                    >
                      包年
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        className={
          isYearly
            ? 'rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-6'
            : 'rounded-2xl border-2 border-slate-200 bg-slate-50/60 p-6'
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
              本次实付
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-4xl font-black tracking-tight text-slate-900">
                ¥{totalAmount.toLocaleString()}
              </span>
              {planType === '2999' && (
                <span className="text-sm font-semibold text-slate-500">
                  （¥{MONTHLY_PRICE.toLocaleString()} × {monthCount} 个月）
                </span>
              )}
            </div>
            {planType === '999' && (
              <p className="mt-3 text-xs leading-[1.95] text-slate-600">
                含一次免费 1v1 诊断 + 50 credits 工具体验；后续升级到 2,999 工具包或 9,999
                增长包时，999 元全额抵扣首期。
              </p>
            )}
            {planType === '2999' && !isYearly && (
              <p className="mt-3 text-xs leading-[1.95] text-slate-600">
                按月订阅 {monthCount} 个月，每月含 200 credits 配额（不结转）。如希望 Credits
                用量不设上限，可选择 12 个月（包年）订阅。
              </p>
            )}
          </div>
          {isYearly && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-amber-950 shadow-sm">
              <Sparkles className="h-3 w-3" />
              Credits 不设上限
            </span>
          )}
        </div>
        {isYearly && (
          <div className="mt-4 rounded-xl border border-amber-200/80 bg-white/70 p-4 text-xs leading-[1.95] text-amber-900 md:text-sm md:leading-[2]">
            <span className="font-bold">包年订阅特权 · </span>
            订单激活后，Credits 用量在订阅期内不设上限，团队可按需使用 OCR、SEO、GEO 等所有 AI
            工具，无月度配额顾虑。
          </div>
        )}
      </div>

      <div className="space-y-6 border-t border-slate-200 pt-8">
        <Label className="text-base font-bold leading-[1.7] text-slate-900">
          3. 填写企业与联系人信息
        </Label>
        <div className="space-y-2">
          <Label htmlFor="companyName">
            公司全称 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="companyName"
            placeholder="例如：北京样本科技有限公司"
            disabled={submitting}
            {...register('companyName')}
          />
          {errors.companyName && (
            <p className="text-xs text-destructive">{errors.companyName.message}</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contactName">
              联系人姓名 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contactName"
              placeholder="例如：张先生"
              disabled={submitting}
              {...register('contactName')}
            />
            {errors.contactName && (
              <p className="text-xs text-destructive">{errors.contactName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">手机号</Label>
            <Input
              id="phone"
              placeholder="13800138000"
              disabled={submitting}
              {...register('phone')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            企业邮箱 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@example.com"
            disabled={submitting}
            {...register('email')}
          />
          <p className="text-xs leading-[1.85] text-slate-500">
            付款完成后会用这个邮箱发激活邮件。请确保填写本人能收件的邮箱。
          </p>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">补充备注（可选）</Label>
          <Textarea
            id="notes"
            placeholder="预约时段偏好 / 来源渠道 / 是否已有数字化基础 / 期望产出等"
            rows={3}
            className="resize-none"
            disabled={submitting}
            {...register('notes')}
          />
        </div>
      </div>

      {error && (
        <div className="space-y-2 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          <div>{error}</div>
          {needLoginUrl && (
            <Link
              href={needLoginUrl}
              className="inline-flex items-center gap-1 text-xs font-bold text-red-900 underline hover:text-red-700"
            >
              点这里登录后再付款 →
            </Link>
          )}
        </div>
      )}

      <div className="border-t border-slate-200 pt-8">
        <Button
          type="submit"
          disabled={submitting}
          className="min-w-[220px] rounded-xl bg-[#00a0e9] text-base text-[#04122c] hover:bg-[#28b3f0]"
        >
          {submitting ? (
            '正在生成订单...'
          ) : (
            <>
              <CreditCard className="mr-1.5 h-4 w-4" />
              去支付 ¥{totalAmount.toLocaleString()}
            </>
          )}
        </Button>
        <p className="mt-4 text-xs leading-[1.95] text-slate-500">
          点击后立即生成微信支付二维码；付款成功后会引导您设置登录密码，并自动进入工作台。
        </p>
      </div>
    </form>
  );
}

function PlanCard({
  checked,
  onClick,
  title,
  tagline,
  price,
  note,
  disabled,
  accent,
}: {
  checked: boolean;
  onClick: () => void;
  title: string;
  tagline: string;
  price: string;
  note: string;
  disabled?: boolean;
  accent: 'sky' | 'amber';
}) {
  const accentTextColor = accent === 'sky' ? 'text-sky-600' : 'text-amber-600';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        checked
          ? 'flex flex-col gap-2 rounded-xl border-2 border-[#070b1c] bg-[#070b1c] p-4 text-left text-white transition'
          : 'flex flex-col gap-2 rounded-xl border-2 border-slate-200 bg-white p-4 text-left text-slate-900 transition hover:border-slate-300'
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className={checked ? 'text-base font-extrabold' : 'text-base font-extrabold'}>
            {title}
          </div>
          <div
            className={
              checked
                ? 'text-[11px] font-bold uppercase tracking-[0.18em] text-white/55'
                : `text-[11px] font-bold uppercase tracking-[0.18em] ${accentTextColor}`
            }
          >
            {tagline}
          </div>
        </div>
        <span
          className={
            checked
              ? 'inline-flex h-5 items-center rounded-full bg-[#00a0e9] px-2 text-[10px] font-bold text-[#04122c]'
              : 'inline-flex h-5 items-center rounded-full bg-slate-100 px-2 text-[10px] font-bold text-slate-500'
          }
        >
          {checked ? '已选' : '点击选择'}
        </span>
      </div>
      <div className="font-mono text-2xl font-black tracking-tight">{price}</div>
      <div
        className={checked ? 'text-xs leading-[1.65] text-white/70' : 'text-xs leading-[1.65] text-slate-500'}
      >
        {note}
      </div>
      {accent === 'amber' && !checked && (
        <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700">
          <Zap className="h-3 w-3" />
          12 个月起 Credits 不设上限
        </div>
      )}
    </button>
  );
}
