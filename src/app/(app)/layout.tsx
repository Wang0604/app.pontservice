import Link from 'next/link';
import { requireUser } from '@/lib/auth/helpers';
import { BrandLogo } from '@/components/brand-logo';
import { SignOutButton } from '@/components/features/sign-out-button';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();

  return (
    <div className="flex min-h-screen flex-col bg-muted/35">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="transition-opacity hover:opacity-85" aria-label="Pontai 首页">
              <BrandLogo />
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-foreground/80">
              <Link href="/tools" className="hover:text-primary">
                工具
              </Link>
              <Link href="/orders" className="hover:text-primary">
                订单
              </Link>
              <Link href="/account" className="hover:text-primary">
                账户
              </Link>
              {(session.user as unknown as { role?: string }).role === 'admin' && (
                <Link href="/admin" className="font-medium text-primary">
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 bg-[radial-gradient(circle_at_top_left,hsl(var(--background))_0,hsl(var(--muted))_42%,hsl(var(--background))_100%)]">
        {children}
      </main>
    </div>
  );
}
