import { cn } from '@/lib/utils';

type BrandLogoProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  admin?: boolean;
};

const sizeMap = {
  sm: { dot: 'h-6 w-6', inner: 'h-2 w-2', text: 'text-sm', gap: 'gap-2' },
  md: { dot: 'h-8 w-8', inner: 'h-2.5 w-2.5', text: 'text-base', gap: 'gap-2.5' },
  lg: { dot: 'h-10 w-10', inner: 'h-3 w-3', text: 'text-lg', gap: 'gap-3' },
};

export function BrandLogo({ className, size = 'md', admin = false }: BrandLogoProps) {
  const s = sizeMap[size];
  return (
    <span className={cn('inline-flex items-center font-sans', s.gap, className)}>
      <span
        className={cn('relative grid place-items-center rounded-full bg-current', s.dot)}
        aria-hidden="true"
      >
        <span className={cn('rounded-full bg-[#00a0e9]', s.inner)} />
      </span>
      <span className={cn('font-black uppercase leading-none tracking-[0.06em]', s.text)}>
        PONT<span className="mx-0.5 text-[#00a0e9]">·</span>AI
      </span>
      {admin && (
        <span className="ml-1 rounded-full border border-current px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">
          Admin
        </span>
      )}
      <span className="sr-only">Pontai</span>
    </span>
  );
}
