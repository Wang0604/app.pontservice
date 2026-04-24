import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Pontai 工具矩阵',
    template: '%s | Pontai',
  },
  description: '为中小企业老板打造的 AI 工具与咨询服务',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://pontai.cloud'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
