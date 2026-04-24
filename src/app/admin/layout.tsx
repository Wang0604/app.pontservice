import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/helpers';
import { SignOutButton } from '@/components/features/sign-out-button';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-muted/40">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-xl font-semibold">
              Pontai <span className="text-primary">Admin</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin" className="hover:text-primary">
                看板
              </Link>
              <Link href="/admin/leads" className="hover:text-primary">
                申请
              </Link>
              <Link href="/admin/orders" className="hover:text-primary">
                订单
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
      <main className="flex-1">{children}</main>
    </div>
  );
}
