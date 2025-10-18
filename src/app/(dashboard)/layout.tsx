'use client';

import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - handles both mobile and desktop */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Page content - with top padding on mobile for fixed header */}
        <main className="flex-1 overflow-auto bg-background pt-16 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
