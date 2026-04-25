import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { getCurrentSession } from '@/lib/auth/helpers';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  const user = session?.user ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b1c]/95 text-white backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" aria-label="PONT·AI 首页" className="text-white">
            <BrandLogo />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-white/75 md:flex">
            <Link href="/diagnosis" className="transition-colors hover:text-white">
              自测
            </Link>
            <Link href="/pricing" className="transition-colors hover:text-white">
              定价
            </Link>
            <Link href="/cases" className="transition-colors hover:text-white">
              案例
            </Link>
            {user ? (
              <Link
                href="/account"
                className="rounded-full border border-white/20 px-4 py-1.5 text-white transition hover:bg-white/10"
              >
                {user.email}
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-full px-4 py-1.5 text-white/85 transition hover:text-white"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-white px-4 py-1.5 font-bold text-[#070b1c] transition hover:bg-white/90"
                >
                  注册
                </Link>
              </div>
            )}
          </nav>
          <Link
            href="/pricing/apply?plan=999"
            className="rounded-full bg-[#00a0e9] px-3 py-1.5 text-xs font-bold text-[#04122c] md:hidden"
          >
            999 诊断
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-white/10 bg-[#070b1c] py-12 text-white/60">
        <div className="container flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-4">
            <BrandLogo size="sm" className="text-white/85" />
            <p className="max-w-xs text-sm leading-6 text-white/55">
              为中小企业老板交付 AI 诊断、工具与陪跑服务。对公合同 · 正规发票 · 人工审核交付。
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            <FooterColumn title="服务">
              <FooterLink href="/pricing">三档套餐</FooterLink>
              <FooterLink href="/diagnosis">AI 自测</FooterLink>
              <FooterLink href="/cases">客户案例</FooterLink>
            </FooterColumn>
            <FooterColumn title="工具">
              <FooterLink href="/tools/ocr-invoice">OCR 发票识别</FooterLink>
              <FooterLink href="/pricing">SEO 诊断（待上线）</FooterLink>
              <FooterLink href="/pricing">GEO 诊断（待上线）</FooterLink>
            </FooterColumn>
            <FooterColumn title="账号">
              <FooterLink href="/login">登录</FooterLink>
              <FooterLink href="/register">注册</FooterLink>
              <FooterLink href="/account">账户中心</FooterLink>
            </FooterColumn>
          </div>
        </div>
        <div className="container mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} PONT·AI · 为实业服务</span>
          <span>中国大陆 · 对公服务</span>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 text-sm">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">{title}</p>
      {children}
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-white/70 transition hover:text-white">
      {children}
    </Link>
  );
}
