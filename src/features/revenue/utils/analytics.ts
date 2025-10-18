/**
 * Analytics utilities for import phase profitability analysis
 * Provides insights into which import phases generate the most profit
 */

import { storageService } from '@/lib/storage';
import { formatVND } from '@/lib/currency';
import { formatProfitMargin } from '@/lib/utils/profit';
import type { RevenueEntry } from '@/types';

export interface ImportPhaseAnalytics {
  importPhaseId: string;
  importPhaseCode: string;
  importDate: Date;
  description?: string;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  revenueEntryCount: number;
  averageProfitPerEntry: number;
  totalQuantitySold: number;
  averageSellingPrice: number;
  averageCostPrice: number;
  profitabilityRank: number;
  riskCategory: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface ImportPhaseAnalyticsResult {
  totalImportPhases: number;
  totalAnalyzedRevenue: number;
  totalAnalyzedProfit: number;
  overallProfitMargin: number;
  mostProfitablePhase: ImportPhaseAnalytics | null;
  leastProfitablePhase: ImportPhaseAnalytics | null;
  highestMarginPhase: ImportPhaseAnalytics | null;
  importPhases: ImportPhaseAnalytics[];
  insights: string[];
}

/**
 * Analyze profitability of all import phases based on revenue entries
 */
export function analyzeImportPhaseProfitability(): ImportPhaseAnalyticsResult {
  try {
    // Use public methods to get data instead of accessing private getData
    const revenueEntries = storageService
      .getRevenueEntries()
      .filter((entry: RevenueEntry) => entry.importPhaseId);
    const importPhases = storageService.getImportPhases();

    if (revenueEntries.length === 0 || importPhases.length === 0) {
      return {
        totalImportPhases: importPhases.length,
        totalAnalyzedRevenue: 0,
        totalAnalyzedProfit: 0,
        overallProfitMargin: 0,
        mostProfitablePhase: null,
        leastProfitablePhase: null,
        highestMarginPhase: null,
        importPhases: [],
        insights: ['No revenue entries linked to import phases for analysis'],
      };
    }

    // Group revenue entries by import phase
    const phaseGroups = new Map<string, RevenueEntry[]>();

    revenueEntries.forEach((entry: RevenueEntry) => {
      if (entry.importPhaseId) {
        const existing = phaseGroups.get(entry.importPhaseId) || [];
        phaseGroups.set(entry.importPhaseId, [...existing, entry]);
      }
    });

    // Calculate analytics for each import phase
    const phaseAnalytics: ImportPhaseAnalytics[] = [];
    let totalAnalyzedRevenue = 0;
    let totalAnalyzedProfit = 0;

    phaseGroups.forEach((entries, phaseId) => {
      const importPhase = importPhases.find((ip) => ip.id === phaseId);
      if (!importPhase) {
        return;
      }

      let totalRevenue = 0;
      let totalCost = 0;
      let totalProfit = 0;
      let totalQuantity = 0;
      let validProfitCalculations = 0;

      entries.forEach((entry: RevenueEntry) => {
        const revenue = entry.netAmount || entry.amount;
        totalRevenue += revenue;
        totalQuantity += entry.quantity;

        try {
          const profitData = storageService.calculateRevenueEntryProfit(entry);
          if (profitData && profitData.costPrice !== null) {
            const entryCost = profitData.costPrice * entry.quantity;
            totalCost += entryCost;
            totalProfit += profitData.profit;
            validProfitCalculations++;
          }
        } catch (error) {
          // Skip entries where profit cannot be calculated
        }
      });

      if (validProfitCalculations === 0) {
        return; // Skip phases with no valid profit data
      }

      const profitMargin =
        totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
      const averageProfitPerEntry =
        entries.length > 0 ? totalProfit / entries.length : 0;
      const averageSellingPrice =
        totalQuantity > 0 ? totalRevenue / totalQuantity : 0;
      const averageCostPrice =
        totalQuantity > 0 ? totalCost / totalQuantity : 0;

      // Determine risk category based on profit margin and volume
      let riskCategory: 'low' | 'medium' | 'high' = 'medium';
      if (profitMargin > 30 && totalRevenue > 1000000) {
        // 30% margin and 1M+ revenue
        riskCategory = 'low';
      } else if (profitMargin < 10 || totalRevenue < 100000) {
        // <10% margin or <100K revenue
        riskCategory = 'high';
      }

      // Generate recommendation
      let recommendation = '';
      if (profitMargin > 40) {
        recommendation =
          'Excellent performance - consider expanding this import strategy';
      } else if (profitMargin > 20) {
        recommendation = 'Good performance - monitor for consistency';
      } else if (profitMargin > 0) {
        recommendation =
          'Low margins - analyze cost optimization opportunities';
      } else {
        recommendation = 'Unprofitable - immediate review required';
      }

      const analytics: ImportPhaseAnalytics = {
        importPhaseId: phaseId,
        importPhaseCode: importPhase.code,
        importDate: importPhase.date,
        description: importPhase.description,
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin,
        revenueEntryCount: entries.length,
        averageProfitPerEntry,
        totalQuantitySold: totalQuantity,
        averageSellingPrice,
        averageCostPrice,
        profitabilityRank: 0, // Will be set after sorting
        riskCategory,
        recommendation,
      };

      phaseAnalytics.push(analytics);
      totalAnalyzedRevenue += totalRevenue;
      totalAnalyzedProfit += totalProfit;
    });

    // Sort by total profit and assign ranks
    phaseAnalytics.sort((a, b) => b.totalProfit - a.totalProfit);
    phaseAnalytics.forEach((phase, index) => {
      phase.profitabilityRank = index + 1;
    });

    // Find key phases
    const mostProfitablePhase = phaseAnalytics[0] || null;
    const leastProfitablePhase =
      phaseAnalytics[phaseAnalytics.length - 1] || null;
    const highestMarginPhase =
      [...phaseAnalytics].sort((a, b) => b.profitMargin - a.profitMargin)[0] ||
      null;

    const overallProfitMargin =
      totalAnalyzedRevenue > 0
        ? (totalAnalyzedProfit / totalAnalyzedRevenue) * 100
        : 0;

    // Generate insights
    const insights = generateProfitabilityInsights(
      phaseAnalytics,
      overallProfitMargin
    );

    return {
      totalImportPhases: phaseGroups.size,
      totalAnalyzedRevenue,
      totalAnalyzedProfit,
      overallProfitMargin,
      mostProfitablePhase,
      leastProfitablePhase,
      highestMarginPhase,
      importPhases: phaseAnalytics,
      insights,
    };
  } catch (error) {
    return {
      totalImportPhases: 0,
      totalAnalyzedRevenue: 0,
      totalAnalyzedProfit: 0,
      overallProfitMargin: 0,
      mostProfitablePhase: null,
      leastProfitablePhase: null,
      highestMarginPhase: null,
      importPhases: [],
      insights: ['Error analyzing import phase profitability'],
    };
  }
}

/**
 * Generate business insights from import phase analytics
 */
function generateProfitabilityInsights(
  phaseAnalytics: ImportPhaseAnalytics[],
  overallMargin: number
): string[] {
  const insights: string[] = [];

  if (phaseAnalytics.length === 0) {
    insights.push('No import phases with sufficient profit data for analysis');
    return insights;
  }

  // Overall performance insights
  if (overallMargin > 30) {
    insights.push('Excellent overall profitability across import phases');
  } else if (overallMargin > 15) {
    insights.push('Good overall profitability with room for optimization');
  } else if (overallMargin > 0) {
    insights.push(
      'Moderate profitability - consider cost reduction strategies'
    );
  } else {
    insights.push('Overall losses detected - immediate strategy review needed');
  }

  // Top performer insights
  const topPerformers = phaseAnalytics.filter((p) => p.profitMargin > 25);
  if (topPerformers.length > 0) {
    insights.push(
      `${topPerformers.length} import phases showing excellent margins (>25%)`
    );
  }

  // Risk insights
  const highRiskPhases = phaseAnalytics.filter(
    (p) => p.riskCategory === 'high'
  );
  if (highRiskPhases.length > 0) {
    insights.push(
      `${highRiskPhases.length} import phases flagged as high risk`
    );
  }

  // Volume vs margin insights
  const highVolumePhases = phaseAnalytics.filter(
    (p) => p.revenueEntryCount > 10
  );
  const highVolumeHighMargin = highVolumePhases.filter(
    (p) => p.profitMargin > 20
  );

  if (highVolumeHighMargin.length > 0) {
    insights.push(
      `${highVolumeHighMargin.length} import phases combine high volume with strong margins`
    );
  }

  // Consistency insights
  const marginSpread =
    Math.max(...phaseAnalytics.map((p) => p.profitMargin)) -
    Math.min(...phaseAnalytics.map((p) => p.profitMargin));

  if (marginSpread > 50) {
    insights.push(
      'High variability in import phase performance - review sourcing strategy'
    );
  } else if (marginSpread < 10) {
    insights.push('Consistent performance across import phases');
  }

  return insights;
}

/**
 * Get the most profitable import phases with detailed breakdown
 */
export function getMostProfitableImportPhases(
  limit: number = 5
): ImportPhaseAnalytics[] {
  const result = analyzeImportPhaseProfitability();
  return result.importPhases.slice(0, limit);
}

/**
 * Get import phases that need attention (low profit or high risk)
 */
export function getImportPhasesNeedingAttention(): ImportPhaseAnalytics[] {
  const result = analyzeImportPhaseProfitability();
  return result.importPhases.filter(
    (phase) => phase.profitMargin < 10 || phase.riskCategory === 'high'
  );
}

/**
 * Format import phase analytics for display
 */
export function formatImportPhaseAnalytics(analytics: ImportPhaseAnalytics): {
  [key: string]: string;
} {
  return {
    phase: `${analytics.importPhaseCode} (${analytics.importDate.toLocaleDateString()})`,
    revenue: formatVND(analytics.totalRevenue),
    profit: formatVND(analytics.totalProfit),
    margin: formatProfitMargin(analytics.profitMargin),
    entries: analytics.revenueEntryCount.toString(),
    avgProfit: formatVND(analytics.averageProfitPerEntry),
    rank: `#${analytics.profitabilityRank}`,
    risk: analytics.riskCategory.toUpperCase(),
    recommendation: analytics.recommendation,
  };
}
