import { Header } from './Header';

interface PageLayoutProps {
  title?: string;
  children: React.ReactNode;
  headerContent?: React.ReactNode;
}

export function PageLayout({
  title,
  children,
  headerContent,
}: PageLayoutProps) {
  return (
    <div className="flex h-screen flex-col">
      <Header title={title}>{headerContent}</Header>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
