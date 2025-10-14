/**
 * Export Page
 * Main page for data export functionality
 */

import { ExportDashboard } from '@/features/export/components/ExportDashboard';

export default function ExportPage() {
  return (
    <main className="min-h-screen bg-background">
      <ExportDashboard />
    </main>
  );
}
