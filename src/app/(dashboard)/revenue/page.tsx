/**
 * Revenue Page
 * Main page for revenue tracking and analytics
 */

import { RevenueDashboard } from '@/features/revenue/components/RevenueDashboard';

export default function RevenuePage() {
  return (
    <main className="min-h-screen bg-background">
      <RevenueDashboard />
    </main>
  );
}
