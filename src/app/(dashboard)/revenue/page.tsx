/**
 * Revenue Page
 * Main page for revenue tracking and analytics
 */

'use client';

import { RevenueDashboard } from '@/features/revenue/components/RevenueDashboard';
import { ResponsiveWrapper } from '@/components/layout/ResponsiveWrapper';

export default function RevenuePage() {
  return (
    <main className="min-h-screen bg-background">
      <ResponsiveWrapper>
        <RevenueDashboard />
      </ResponsiveWrapper>
    </main>
  );
}
