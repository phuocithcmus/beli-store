'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Package,
  Upload,
  TrendingUp,
  Download,
  Menu,
  Boxes,
  BarChart,
  Calculator,
} from 'lucide-react';

const navigation = [
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Variants', href: '/variants', icon: Boxes },
  { name: 'Sales Analytics', href: '/analytics/sales', icon: BarChart },
  { name: 'Imports', href: '/imports', icon: Upload },
  { name: 'Revenue', href: '/revenue', icon: TrendingUp },
  { name: 'Fees', href: '/fees', icon: Calculator },
  { name: 'Export', href: '/export', icon: Download },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden w-64 bg-card shadow-sm lg:block">
        <div className="flex h-16 items-center px-6">
          <h1 className="text-xl font-bold">Clothing Store</h1>
        </div>
        <nav className="mt-8 space-y-1 px-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Mobile menu button */}
        <div className="flex h-16 items-center justify-between bg-card px-4 shadow-sm lg:hidden">
          <h1 className="text-lg font-semibold">Clothing Store</h1>
          <button className="p-2">
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
