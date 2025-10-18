/**
 * Export Page
 * Main page for data export functionality
 */

'use client';

import { ExportDashboard } from '@/features/export/components/ExportDashboard';
import { ResponsiveWrapper } from '@/components/layout/ResponsiveWrapper';

export default function ExportPage() {
  return (
    <main className="min-h-screen bg-background">
      <ResponsiveWrapper>
        <ExportDashboard />
      </ResponsiveWrapper>
    </main>
  );
}
