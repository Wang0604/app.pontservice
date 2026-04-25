import Image from 'next/image';
import { cn } from '@/lib/utils';

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  admin?: boolean;
};

export function BrandLogo({ className, imageClassName, admin = false }: BrandLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Image
        src="/brand/pontai-logo.svg"
        alt="Pontai"
        width={128}
        height={72}
        priority
        className={cn('h-9 w-auto', imageClassName)}
      />
      {admin && (
        <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Admin
        </span>
      )}
    </span>
  );
}
