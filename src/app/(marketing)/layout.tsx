import Link from 'next/link';
import { getCurrentSession } from '@/lib/auth/helpers';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  const user = session?.user ?? null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-semibold">
            Pontai
          </Link>
          <nav className="flex items-center gap-6 text-sm">
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
              <Link
                href="/login"
                className="rounded-md border px-3 py-1.5 hover:bg-accent"
              >
                登录
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Pontai · 为实业服务
        </div>
      </footer>
    </div>
  );
}
