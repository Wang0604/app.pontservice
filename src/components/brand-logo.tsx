import { cn } from '@/lib/utils';

type BrandLogoProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  admin?: boolean;
};

const heightMap = {
  sm: 'h-9',
  md: 'h-11',
  lg: 'h-14',
};

export function BrandLogo({ className, size = 'md', admin = false }: BrandLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <svg
        aria-hidden="true"
        viewBox="60 220 710 390"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('w-auto', heightMap[size])}
      >
        <polygon
          fill="currentColor"
          points="101.81 601 72.22 601 134.92 446.75 164.51 446.75 101.81 601"
        />
        <polygon
          fill="currentColor"
          points="136.04 546.72 125.36 572.98 190.44 572.98 190.44 546.72 136.04 546.72"
        />
        <polyline fill="currentColor" points="227.61 601 164.91 446.75 135.31 446.75 198.01 601" />
        <rect fill="#00a0e9" x="286.08" y="446.75" width="26.26" height="154.26" />
        <rect
          fill="currentColor"
          x="735.83"
          y="310.51"
          width="22.94"
          height="61.74"
          transform="translate(1088.68 -405.93) rotate(90)"
        />
        <rect fill="currentColor" x="86.44" y="267.74" width="26.26" height="147.99" />
        <rect fill="currentColor" x="406.95" y="267.38" width="26.26" height="147.99" />
        <polygon
          fill="currentColor"
          points="527.37 415.37 498.91 415.37 406.95 267.38 435.4 267.38 527.37 415.37"
        />
        <rect fill="currentColor" x="501.1" y="267.38" width="26.26" height="147.99" />
        <rect fill="currentColor" x="585.09" y="267.38" width="26.26" height="147.99" />
        <rect
          fill="currentColor"
          x="585.09"
          y="225.04"
          width="26.26"
          height="110.96"
          transform="translate(878.74 -317.71) rotate(90)"
        />
        <path
          fill="currentColor"
          d="M110.07,267.74V294h44.3a17.29,17.29,0,0,1,17.29,17.29h0a29.87,29.87,0,0,1-29.87,29.88H124.45v26.26h17.14a56.33,56.33,0,0,0,56.33-56.34h0a43.36,43.36,0,0,0-43.35-43.36Z"
        />
        <path
          fill="#00a0e9"
          d="M299.22,249.39a92.35,92.35,0,1,0,92.35,92.35A92.35,92.35,0,0,0,299.22,249.39Zm0,159.41a67.06,67.06,0,1,1,67-67.06A67.06,67.06,0,0,1,299.22,408.8Z"
        />
      </svg>
      <span className="sr-only">PONT-AI</span>
      {admin && (
        <span className="rounded-full border border-current px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">
          Admin
        </span>
      )}
    </span>
  );
}
