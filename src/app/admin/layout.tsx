import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/helpers';
import { BrandLogo } from '@/components/brand-logo';
import { SignOutButton } from '@/components/features/sign-out-button';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-muted/35">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="transition-opacity hover:opacity-85" aria-label="Pontai Admin">
              <BrandLogo admin />
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-foreground/80">
              <Link href="/admin" className="hover:text-primary">
                看板
              </Link>
              <Link href="/admin/leads" className="hover:text-primary">
                申请
              </Link>
              <Link href="/admin/orders" className="hover:text-primary">
                订单
              </Link>
              <Link
                href="/admin/quick-orders/new"
                className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/20"
              >
                快速收款 +
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-muted-foreground hover:underline">
              返回前台
            </Link>
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
