import Link from 'next/link';
import { requireUser } from '@/lib/auth/helpers';
import { SignOutButton } from '@/components/features/sign-out-button';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-semibold">
              Pontai
            </Link>
            <nav className="flex items-center gap-4 text-sm">
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
      <main className="flex-1">{children}</main>
    </div>
  );
}
