'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PLANS, PLAN_IDS, type PlanId } from '@/lib/pricing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

const applySchema = z.object({
  companyName: z.string().min(2, '公司名至少 2 个字'),
  contactName: z.string().min(1, '必填'),
  email: z.string().email('邮箱格式不对'),
  phone: z.string().optional(),
  interestedPlan: z.enum(PLAN_IDS),
  useCase: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
});

type ApplyInput = z.infer<typeof applySchema>;

interface Prefill {
  email?: string;
  name?: string;
  companyName?: string;
  phone?: string;
}

const STEPS = [
  {
    id: 'plan',
    title: '选择套餐',
    fields: ['interestedPlan'],
  },
  {
    id: 'info',
    title: '联系信息',
    fields: ['companyName', 'contactName', 'email', 'phone'],
  },
  {
    id: 'details',
    title: '需求详情',
    fields: ['useCase', 'notes'],
  },
];

export function ApplyForm({
  defaultPlan,
  prefill,
}: {
  defaultPlan: PlanId;
  prefill?: Prefill;
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    trigger,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ApplyInput>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      interestedPlan: defaultPlan,
      email: prefill?.email ?? '',
      contactName: prefill?.name ?? '',
      companyName: prefill?.companyName ?? '',
      phone: prefill?.phone ?? '',
    },
  });

  const selectedPlan = watch('interestedPlan');

  async function handleNext() {
    const fields = STEPS[currentStep].fields as (keyof ApplyInput)[];
    const isValid = await trigger(fields);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  }

  function handlePrev() {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  async function onSubmit(data: ApplyInput) {
    if (currentStep !== STEPS.length - 1) return;
    
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
    <div className="space-y-8 py-4">
      {/* Progress Indicator */}
      <div className="relative mb-12 px-6">
        <div className="absolute left-10 right-10 top-4 -translate-y-1/2 h-0.5 bg-muted"></div>
        <div
          className="absolute left-10 top-4 -translate-y-1/2 h-0.5 bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `calc(${(currentStep / (STEPS.length - 1)) * 100}% - 2.5rem)` }}
        ></div>
        <div className="relative flex justify-between">
          {STEPS.map((step, index) => {
            const isCompleted = currentStep > index;
            const isCurrent = currentStep === index;
            
            return (
              <div key={step.id} className="flex flex-col items-center gap-2 relative z-10">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background transition-colors duration-300 ${
                    isCompleted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCurrent
                      ? 'border-primary text-primary shadow-sm'
                      : 'border-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </div>
                <span
                  className={`absolute top-10 w-24 text-center text-xs font-medium transition-colors ${
                    isCurrent || isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Plan */}
        <div className={currentStep === 0 ? 'block space-y-4 animate-in fade-in slide-in-from-right-4 duration-500' : 'hidden'}>
          <div className="space-y-4">
            <Label className="text-base font-medium">您对哪个套餐感兴趣？</Label>
            <div className="grid gap-4 sm:grid-cols-3">
              {PLANS.map((plan) => (
                <label
                  key={plan.id}
                  className={`relative flex cursor-pointer flex-col rounded-xl border-2 p-5 shadow-sm transition-all hover:border-primary/50 ${
                    selectedPlan === plan.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-muted bg-background'
                  }`}
                >
                  <input
                    type="radio"
                    value={plan.id}
                    {...register('interestedPlan')}
                    className="sr-only"
                  />
                  <div className="font-semibold">{plan.shortLabel}</div>
                  <div className="mt-2 text-sm text-muted-foreground leading-relaxed">{plan.tagline}</div>
                  {selectedPlan === plan.id && (
                    <div className="absolute top-4 right-4 text-primary animate-in zoom-in duration-300">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                </label>
              ))}
            </div>
            {errors.interestedPlan && (
              <p className="text-xs text-destructive">{errors.interestedPlan.message}</p>
            )}
          </div>
        </div>

        {/* Step 2: Info */}
        <div className={currentStep === 1 ? 'block space-y-5 animate-in fade-in slide-in-from-right-4 duration-500' : 'hidden'}>
          <div className="space-y-2">
            <Label htmlFor="companyName">公司全称 <span className="text-destructive">*</span></Label>
            <Input
              id="companyName"
              placeholder="例如：北京样本科技有限公司"
              className="h-11 transition-colors focus-visible:ring-primary/50"
              {...register('companyName')}
            />
            {errors.companyName && (
              <p className="text-xs text-destructive">{errors.companyName.message}</p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactName">联系人姓名 <span className="text-destructive">*</span></Label>
              <Input 
                id="contactName" 
                placeholder="例如：张先生" 
                className="h-11 transition-colors focus-visible:ring-primary/50"
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
                className="h-11 transition-colors focus-visible:ring-primary/50"
                {...register('phone')} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">企业邮箱 <span className="text-destructive">*</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              className="h-11 transition-colors focus-visible:ring-primary/50"
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
        </div>

        {/* Step 3: Details */}
        <div className={currentStep === 2 ? 'block space-y-5 animate-in fade-in slide-in-from-right-4 duration-500' : 'hidden'}>
          <div className="space-y-2">
            <Label htmlFor="useCase">您希望用它解决什么问题？</Label>
            <Textarea
              id="useCase"
              placeholder="例如：每月 200 张发票人工录入要 3 天；或者想知道自己的网站在 DeepSeek / Claude 里能不能被推荐"
              rows={5}
              className="resize-none transition-colors focus-visible:ring-primary/50"
              {...register('useCase')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">其他备注（可选）</Label>
            <Input 
              id="notes" 
              placeholder="特殊需求 / 来源渠道 / 参考客户等" 
              className="h-11 transition-colors focus-visible:ring-primary/50"
              {...register('notes')} 
            />
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md animate-in fade-in">{error}</p>}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-8 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 0 || submitting}
            className={currentStep === 0 ? 'invisible' : ''}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            上一步
          </Button>
          
          {currentStep < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext} className="min-w-[120px]">
              下一步
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={submitting} className="min-w-[140px]">
              {submitting ? '提交中...' : '提交申请'}
              {!submitting && <CheckCircle2 className="ml-2 h-4 w-4" />}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
