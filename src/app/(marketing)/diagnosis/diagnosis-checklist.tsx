'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const questions = [
  '每周有超过 3 小时花在整理发票、合同、表格或截图上',
  '员工经常把客户信息复制到多个系统，数据容易不一致',
  '客户咨询、报价、交付进度里有大量重复问答',
  '老板需要亲自盯销售跟进或交付节点，无法只看仪表盘',
  '官网、文章、案例长期没有稳定更新，搜索获客偏弱',
  '想试 AI，但不知道先从哪个流程开始，担心买工具后没人用',
];

function getResult(score: number) {
  if (score <= 1) {
    return {
      title: '可以先观察一阵',
      description:
        '当前痛点还不够集中，建议先记录一周重复工作；如果一周后命中条目变多，再申请 999 启动包做一次免费诊断。',
      action: '先看案例',
      href: '/cases',
    };
  }

  if (score <= 3) {
    return {
      title: '适合从启动包切入',
      description:
        '你已经有明确的重复环节，建议申请 999 启动包：免费诊断会议会帮你定位最值得做的 1-2 个 AI 场景，再决定升级 2999 工具包，999 元全额抵扣。',
      action: '申请启动包',
      href: '/pricing/apply',
    };
  }

  return {
    title: '建议先做 999 启动包',
    description:
      '痛点已经跨越多个流程，直接买工具容易分散。先用启动包做一次免费诊断，把 1-2 个高回报场景拆清楚再落地；999 元升级 2999 工具包时全额抵扣。',
    action: '申请启动包',
    href: '/pricing/apply',
  };
}

export function DiagnosisChecklist() {
  const [checked, setChecked] = useState<Set<number>>(() => new Set());
  const score = checked.size;
  const result = useMemo(() => getResult(score), [score]);

  function toggle(index: number) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI 诊断自测</CardTitle>
        <CardDescription>勾选符合现状的项目，系统会给出一个保守建议。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          {questions.map((question, index) => {
            const active = checked.has(index);
            return (
              <button
                key={question}
                type="button"
                onClick={() => toggle(index)}
                className={
                  active
                    ? 'flex w-full items-start gap-3 rounded-lg border border-primary bg-primary/5 p-4 text-left text-sm transition-colors'
                    : 'flex w-full items-start gap-3 rounded-lg border p-4 text-left text-sm transition-colors hover:bg-accent'
                }
              >
                <span
                  className={
                    active
                      ? 'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'
                      : 'mt-0.5 h-5 w-5 shrink-0 rounded-full border'
                  }
                >
                  {active && <CheckCircle2 className="h-4 w-4" />}
                </span>
                <span>{question}</span>
              </button>
            );
          })}
        </div>

        <div className="rounded-lg border bg-muted/30 p-6">
          <div className="text-sm text-muted-foreground">已勾选</div>
          <div className="mt-2 text-4xl font-bold">{score}/6</div>
          <h3 className="mt-6 text-lg font-semibold">{result.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{result.description}</p>
          <Button asChild className="mt-6 w-full">
            <Link href={result.href}>
              {result.action}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
