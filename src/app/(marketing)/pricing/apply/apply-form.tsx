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

export function ApplyForm({
  defaultPlan,
  prefill,
}: {
  defaultPlan: PlanId;
  prefill?: Prefill;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
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

  async function onSubmit(data: ApplyInput) {
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">公司全称 *</Label>
        <Input
          id="companyName"
          placeholder="北京样本科技有限公司"
          {...register('companyName')}
        />
        {errors.companyName && (
          <p className="text-xs text-destructive">{errors.companyName.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactName">联系人姓名 *</Label>
          <Input id="contactName" placeholder="张总" {...register('contactName')} />
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
        <Label htmlFor="email">企业邮箱 *</Label>
        <Input
          id="email"
          type="email"
          placeholder="[email protected]"
          {...register('email')}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>意向套餐 *</Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <label
              key={plan.id}
              className={
                selectedPlan === plan.id
                  ? 'cursor-pointer rounded-md border-2 border-primary bg-accent/40 p-3'
                  : 'cursor-pointer rounded-md border p-3 hover:bg-accent/40'
              }
            >
              <input
                type="radio"
                value={plan.id}
                {...register('interestedPlan')}
                className="sr-only"
              />
              <div className="text-sm font-medium">{plan.shortLabel}</div>
              <div className="text-xs text-muted-foreground">{plan.tagline}</div>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="useCase">您希望用它解决什么问题？</Label>
        <Textarea
          id="useCase"
          placeholder="例如：每月 200 张发票人工录入要 3 天；或者想知道自己的网站在 DeepSeek / Claude 里能不能被推荐"
          rows={4}
          {...register('useCase')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">备注（可选）</Label>
        <Input id="notes" placeholder="特殊需求 / 来源渠道 / 参考客户" {...register('notes')} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? '提交中...' : '提交申请'}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        提交即表示同意在审核通过后收到我们发送的合同
      </p>
    </form>
  );
}
