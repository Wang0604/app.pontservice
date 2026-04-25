import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { getCurrentSession } from '@/lib/auth/helpers';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  const user = session?.user ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="transition-opacity hover:opacity-85" aria-label="Pontai 首页">
            <BrandLogo />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-foreground/80">
            <Link href="/diagnosis" className="hover:text-primary">
              自测
            </Link>
            <Link href="/pricing" className="hover:text-primary">
              定价
            </Link>
            <Link href="/cases" className="hover:text-primary">
              案例
            </Link>
            {user ? (
              <Link
                href="/account"
                className="rounded-md border px-3 py-1.5 hover:bg-accent"
              >
                {user.email}
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-md px-3 py-1.5 hover:bg-accent"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="rounded-md border bg-primary px-3 py-1.5 text-primary-foreground hover:opacity-90"
                >
                  注册
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-card/70 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Pontai · 为实业服务
        </div>
      </footer>
    </div>
  );
}
