'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { PLANS, PLAN_IDS, type PlanId } from '@/lib/pricing';
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
];

const PAIN_POINT_LABEL = new Map(PAIN_POINTS.map((p) => [p.id, p.label]));

const applySchema = z.object({
  painPoints: z.array(z.string()).min(1, '至少选一个'),
  goal: z.string().min(8, '说说想解决什么具体问题（至少 8 个字）').max(500),
  interestedPlan: z.enum(PLAN_IDS),
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
  { id: 'plan', title: '选择服务', fields: ['interestedPlan'] },
  { id: 'contact', title: '联系方式', fields: ['companyName', 'contactName', 'email', 'phone'] },
];

export function ApplyForm({ defaultPlan, prefill }: { defaultPlan: PlanId; prefill?: Prefill }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      interestedPlan: defaultPlan,
      email: prefill?.email ?? '',
      contactName: prefill?.name ?? '',
      companyName: prefill?.companyName ?? '',
      phone: prefill?.phone ?? '',
      notes: '',
    },
  });

  const selectedPlan = watch('interestedPlan');
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
    setSubmitting(true);
    try {
      const useCase = [
        '【自检勾选】',
        ...data.painPoints.map((id) => `- ${PAIN_POINT_LABEL.get(id) ?? id}`),
        '',
        '【最想解决的问题】',
        data.goal,
      ].join('\n');

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: data.companyName,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          interestedPlan: data.interestedPlan,
          useCase,
          notes: data.notes,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? '提交失败，请稍后再试');
      }
      const { leadId } = await res.json();
      router.push(`/pricing/apply/success?leadId=${leadId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
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
      </ol>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {currentStep === 0 && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-7 duration-500">
            <div className="space-y-3">
              <Label className="text-base font-bold text-slate-900">
                你的业务里，下面这些情况存在吗？
              </Label>
              <p className="text-sm leading-6 text-slate-500">
                勾选所有命中的项目，作为 999 诊断会议时的对照清单；至少选一个。
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
              <Label className="text-base font-bold text-slate-900">您希望从哪一档开始？</Label>
              <p className="text-sm leading-6 text-slate-500">
                推荐先选 999 诊断；如果已经明确要用工具，可以直接选 2999 / 9999，已购买的 999
                元全额抵扣首期。
              </p>
            </div>
            <div className="grid gap-3">
              {PLANS.map((plan) => {
                const checked = selectedPlan === plan.id;
                const recommended = plan.id === '999';
                return (
                  <label
                    key={plan.id}
                    className={
                      checked
                        ? 'flex cursor-pointer items-start gap-4 rounded-2xl border-2 border-[#070b1c] bg-[#070b1c] p-5 text-white transition'
                        : 'flex cursor-pointer items-start gap-4 rounded-2xl border-2 border-slate-200 bg-white p-5 text-slate-900 transition hover:border-slate-300'
                    }
                  >
                    <input
                      type="radio"
                      value={plan.id}
                      {...register('interestedPlan')}
                      className="sr-only"
                    />
                    <span
                      className={
                        checked
                          ? 'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00a0e9] text-white'
                          : 'mt-1 h-5 w-5 shrink-0 rounded-full border-2 border-slate-300'
                      }
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-lg font-extrabold tracking-tight">
                          {plan.shortLabel}
                        </span>
                        {recommended && (
                          <span
                            className={
                              checked
                                ? 'rounded-full bg-[#00a0e9] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#04122c]'
                                : 'rounded-full bg-[#00a0e9]/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#0a6ea3]'
                            }
                          >
                            Recommended
                          </span>
                        )}
                      </div>
                      <p
                        className={
                          checked ? 'mt-1 text-sm text-white/75' : 'mt-1 text-sm text-slate-600'
                        }
                      >
                        {plan.tagline}
                      </p>
                      {plan.id !== '999' && (
                        <p
                          className={
                            checked ? 'mt-2 text-xs text-[#00a0e9]' : 'mt-2 text-xs text-[#0a6ea3]'
                          }
                        >
                          已购买 999 诊断的客户，可全额抵扣首期 999 元
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.interestedPlan && (
              <p className="text-xs text-destructive">{errors.interestedPlan.message}</p>
            )}
          </div>
        )}

        {currentStep === 2 && (
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
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">补充备注（可选）</Label>
              <Textarea
                id="notes"
                placeholder="预约时段偏好 / 来源渠道 / 期望产出等"
                rows={3}
                className="resize-none"
                {...register('notes')}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                {error}
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
              className="min-w-[140px] rounded-xl bg-[#00a0e9] text-[#04122c] hover:bg-[#28b3f0]"
            >
              {submitting ? '提交中...' : '提交申请'}
              {!submitting && <CheckCircle2 className="ml-1 h-4 w-4" />}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
