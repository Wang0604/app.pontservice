'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type RunStatus = 'idle' | 'uploading' | 'pending' | 'running' | 'succeeded' | 'failed';

export function OcrTool({ userId: _userId, disabled }: { userId: string; disabled: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<RunStatus>('idle');
  const [runId, setRunId] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function handleStart() {
    if (!file) return;
    setError(null);
    setResult(null);
    setStatus('uploading');

    try {
      const intentRes = await fetch('/api/upload/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          sizeBytes: file.size,
          purpose: 'ocr-input',
        }),
      });
      if (!intentRes.ok) throw new Error('获取上传凭证失败');
      const intent = await intentRes.json();

      const putRes = await fetch(intent.url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!putRes.ok) throw new Error('上传失败');

      setStatus('pending');

      const runRes = await fetch('/api/tools/ocr-invoice/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKey: intent.key, filename: file.name }),
      });
      if (!runRes.ok) throw new Error((await runRes.json()).error ?? '启动失败');
      const { runId: newRunId } = await runRes.json();
      setRunId(newRunId);
      pollStatus(newRunId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '失败');
      setStatus('failed');
    }
  }

  function pollStatus(id: string) {
    let delay = 2000;
    const tick = async () => {
      try {
        const res = await fetch(`/api/tools/ocr-invoice/status?runId=${id}`);
        if (!res.ok) throw new Error('查询状态失败');
        const data = await res.json();
        setStatus(data.status);
        if (data.status === 'succeeded') {
          setResult(data.output);
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else if (data.status === 'failed') {
          setError(data.error ?? '处理失败');
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch (err) {
        console.error('[ocr poll]', err);
      }
      delay = Math.min(delay * 1.4, 10000);
    };
    tick();
    intervalRef.current = setInterval(tick, delay);
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setFile(null);
    setStatus('idle');
    setRunId(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-4">
      {status === 'idle' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="file">选择 PDF / 图片</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,image/jpeg,image/png"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={disabled}
            />
          </div>
          <Button onClick={handleStart} disabled={!file || disabled}>
            开始识别（消耗 5 credits）
          </Button>
        </div>
      )}

      {(status === 'uploading' || status === 'pending' || status === 'running') && (
        <div className="rounded border p-6 text-center">
          <div className="mb-2 text-sm font-medium">
            {status === 'uploading' && '正在上传...'}
            {status === 'pending' && '已提交，排队中...'}
            {status === 'running' && '正在识别并解析...'}
          </div>
          <div className="text-xs text-muted-foreground">
            通常需要 20-60 秒，请不要关闭页面
          </div>
        </div>
      )}

      {status === 'succeeded' && result && (
        <div className="space-y-4">
          <div className="rounded bg-emerald-50 p-3 text-sm text-emerald-700">
            识别成功 · 下方为结构化结果
          </div>
          <pre className="max-h-[600px] overflow-auto rounded border bg-muted p-4 text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset}>
              再识别一份
            </Button>
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
            >
              复制 JSON
            </Button>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="space-y-4">
          <div className="rounded bg-red-50 p-3 text-sm text-red-700">
            识别失败{error && `: ${error}`}
            <br />
            已自动退还 5 credits。
          </div>
          <Button variant="outline" onClick={reset}>
            重试
          </Button>
        </div>
      )}
    </div>
  );
}
