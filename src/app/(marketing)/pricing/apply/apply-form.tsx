'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const PAIN_POINTS = [
  { id: 'invoice', label: '发票、合同、表格人工录入很多' },
  { id: 'support', label: '客服 / 销售有大量重复问答' },
  { id: 'unclear', label: '想用 AI 但不知道从哪里开始' },
  { id: 'content', label: '官网、公众号、SEO 长期不更新' },
  { id: 'geo', label: '客户在 AI 平台里搜不到我们' },
  { id: 'tools', label: '已经在用某些 AI 工具，但没融入流程' },
  { id: 'rivals', label: '同行已经在用 AI，担心被甩开' },
  { id: 'workflow', label: '业务流程长，需要人工串联多个系统' },
  { id: 'no_digital', label: '还没做完数字化，担心 AI 上不去' },
];

const PAIN_POINT_LABEL = new Map(PAIN_POINTS.map((p) => [p.id, p.label]));

const applySchema = z.object({
  painPoints: z.array(z.string()).min(1, '至少选一个'),
  goal: z.string().min(8, '说说想解决什么具体问题（至少 8 个字）').max(500),
  companyName: z.string().min(2, '公司名至少 2 个字'),
  contactName: z.string().min(1, '必填'),
  email: z.string().email('邮箱格式不对'),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type ApplyInput = z.infer<typeof applySchema>;

interface Prefill {
  email?: string;
  name?: string;
  companyName?: string;
  phone?: string;
}

const STEPS: { id: string; title: string; fields: (keyof ApplyInput)[] }[] = [
  { id: 'diagnose', title: '业务自检', fields: ['painPoints', 'goal'] },
  { id: 'contact', title: '联系方式', fields: ['companyName', 'contactName', 'email', 'phone'] },
];

export function ApplyForm({ prefill }: { prefill?: Prefill }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needLoginUrl, setNeedLoginUrl] = useState<string | null>(null);

  const {
    register,
    trigger,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ApplyInput>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      painPoints: [],
      goal: '',
      email: prefill?.email ?? '',
      contactName: prefill?.name ?? '',
      companyName: prefill?.companyName ?? '',
      phone: prefill?.phone ?? '',
      notes: '',
    },
  });

  const painPoints = watch('painPoints') ?? [];

  function togglePainPoint(id: string) {
    const next = painPoints.includes(id) ? painPoints.filter((p) => p !== id) : [...painPoints, id];
    setValue('painPoints', next, { shouldValidate: true });
  }

  async function handleNext() {
    const fields = STEPS[currentStep].fields;
    const ok = await trigger(fields);
    if (ok) setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function handlePrev() {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit(data: ApplyInput) {
    if (currentStep !== STEPS.length - 1) return;
    setError(null);
    setNeedLoginUrl(null);
    setSubmitting(true);
    try {
      const useCase = [
        '【自检勾选】',
        ...data.painPoints.map((id) => `- ${PAIN_POINT_LABEL.get(id) ?? id}`),
        '',
        '【最想解决的问题】',
        data.goal,
      ].join('\n');

      const res = await fetch('/api/checkout/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: data.companyName,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          useCase,
          notes: data.notes,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        orderId?: string;
        paymentPageUrl?: string;
        error?: string;
        needLogin?: boolean;
        loginUrl?: string;
      };
      if (!res.ok || !body.ok || !body.paymentPageUrl) {
        if (body.needLogin && body.loginUrl) {
          setNeedLoginUrl(body.loginUrl);
        }
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
    <div className="space-y-8">
      <div className="rounded-2xl border-2 border-[#00a0e9]/30 bg-[#00a0e9]/5 p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00a0e9] text-white">
            <CreditCard className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">
              下一步：在线微信支付 ¥999，立即激活账户
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              提交后立刻生成订单二维码 → 微信扫码付款 → 当场设置邮箱密码 → 自动进入工作台。
              不需要等审批、不需要打款回单，全程不超过 3 分钟。
            </p>
          </div>
        </div>
      </div>

      <ol className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
        {STEPS.map((s, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <li
              key={s.id}
              className={
                active
                  ? 'flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-white'
                  : done
                    ? 'flex items-center gap-2 rounded-full bg-[#00a0e9]/15 px-3 py-1.5 text-[#0a6ea3]'
                    : 'flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-slate-500'
              }
            >
              <span
                className={
                  active
                    ? 'flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-900'
                    : done
                      ? 'flex h-5 w-5 items-center justify-center rounded-full bg-[#00a0e9] text-white'
                      : 'flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-500'
                }
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span>{s.title}</span>
            </li>
          );
        })}
        <li className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-slate-500">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-500">
            3
          </span>
          <span>支付 ¥999</span>
        </li>
        <li className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-slate-500">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-500">
            4
          </span>
          <span>设置密码</span>
        </li>
      </ol>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {currentStep === 0 && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-7 duration-500">
            <div className="space-y-3">
              <Label className="text-base font-bold text-slate-900">
                你的业务里，下面这些情况存在吗？
              </Label>
              <p className="text-sm leading-6 text-slate-500">
                勾选所有命中的项目，作为顾问准备启动包诊断会议时的对照清单；至少选一个。
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {PAIN_POINTS.map((p) => {
                  const checked = painPoints.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePainPoint(p.id)}
                      className={
                        checked
                          ? 'flex items-start gap-3 rounded-xl border-2 border-[#070b1c] bg-[#070b1c] p-4 text-left text-sm font-medium text-white transition'
                          : 'flex items-start gap-3 rounded-xl border-2 border-slate-200 bg-white p-4 text-left text-sm font-medium text-slate-800 transition hover:border-slate-300'
                      }
                    >
                      <span
                        className={
                          checked
                            ? 'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00a0e9] text-white'
                            : 'mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-slate-300'
                        }
                      >
                        {checked && <Check className="h-3 w-3" />}
                      </span>
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
              {errors.painPoints && (
                <p className="text-xs text-destructive">{errors.painPoints.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="goal" className="text-base font-bold text-slate-900">
                这次想优先解决的具体问题是什么？
              </Label>
              <p className="text-sm leading-6 text-slate-500">
                3-5 句话即可，作为顾问准备诊断会议的输入。
              </p>
              <Textarea
                id="goal"
                placeholder="例如：每月 200 张发票人工录入要 3 天，想看 OCR 能不能直接接报销系统；或者：想知道我们的官网在 DeepSeek 上能不能被推荐到。"
                rows={5}
                className="resize-none"
                {...register('goal')}
              />
              {errors.goal && <p className="text-xs text-destructive">{errors.goal.message}</p>}
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-5 duration-500">
            <div className="space-y-2">
              <Label htmlFor="companyName">
                公司全称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companyName"
                placeholder="例如：北京样本科技有限公司"
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
                <Input id="contactName" placeholder="例如：张先生" {...register('contactName')} />
                {errors.contactName && (
                  <p className="text-xs text-destructive">{errors.contactName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">手机号</Label>
                <Input id="phone" placeholder="13800138000" {...register('phone')} />
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
                {...register('email')}
              />
              <p className="text-xs text-slate-500">
                付款完成后会用这个邮箱设置登录密码，请确保填写本人能收件的邮箱。
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
                {...register('notes')}
              />
            </div>

            {error && (
              <div className="space-y-2 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                <div>{error}</div>
                {needLoginUrl && (
                  <Link
                    href={needLoginUrl}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-900 underline hover:text-red-700"
                  >
                    点这里登录后再申请 →
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-7">
          <Button
            type="button"
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 0 || submitting}
            className={currentStep === 0 ? 'invisible' : ''}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            上一步
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="min-w-[120px] rounded-xl bg-[#070b1c] text-white hover:bg-[#0e1430]"
            >
              下一步
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={submitting}
              className="min-w-[180px] rounded-xl bg-[#00a0e9] text-[#04122c] hover:bg-[#28b3f0]"
            >
              {submitting ? '正在生成订单...' : '去支付 ¥999'}
              {!submitting && <CreditCard className="ml-1.5 h-4 w-4" />}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
