/**
 * Search and Filtering Utilities for Fee Management
 * Provides comprehensive search and filtering capabilities across all fee-related entities
 * Implements T044 - Fee-related search/filtering capabilities
 */

// Define minimal types locally to avoid import issues
export interface ImportFee {
  id: string;
  importPhaseId: string;
  description: string;
  category: string;
  supplier?: string;
  notes?: string;
  amount: number;
  currency: string;
  date: Date;
}

export interface ChannelFeeStructure {
  id: string;
  name: string;
  channel: string;
  description?: string;
  feeType: string;
  feeValue: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  sku?: string;
  tags?: string[];
  importFees?: ImportFee[];
  price?: number;
}

export interface SearchableItem {
  id: string;
  type: 'import_fee' | 'channel_fee' | 'product' | 'fee_calculation';
  searchableText: string;
  metadata?: Record<string, unknown>;
}

export interface FeeSearchFilter {
  // Text search
  query?: string;
  searchFields?: string[];

  // Date range
  dateFrom?: Date;
  dateTo?: Date;

  // Amount range
  amountFrom?: number;
  amountTo?: number;

  // Fee-specific filters
  feeType?: 'import' | 'channel' | 'all';
  importPhase?: string;
  channel?: string;
  currency?: string;
  status?: 'active' | 'inactive' | 'all';

  // Advanced filters
  hasCalculations?: boolean;
  profitMarginRange?: {
    min: number;
    max: number;
  };

  // Sorting
  sortBy?: 'date' | 'amount' | 'name' | 'relevance';
  sortOrder?: 'asc' | 'desc';

  // Pagination
  page?: number;
  pageSize?: number;
}

export interface SearchResult<T = unknown> {
  item: T;
  type: 'import_fee' | 'channel_fee' | 'product' | 'fee_calculation';
  relevanceScore: number;
  matchedFields: string[];
  highlights?: string[];
}

export interface SearchResponse<T = unknown> {
  results: SearchResult<T>[];
  totalResults: number;
  totalPages: number;
  currentPage: number;
  facets: SearchFacets;
  suggestions?: string[];
}

export interface SearchFacets {
  feeTypes: { value: string; count: number }[];
  channels: { value: string; count: number }[];
  importPhases: { value: string; count: number }[];
  currencies: { value: string; count: number }[];
  amountRanges: { range: string; count: number }[];
  dateRanges: { range: string; count: number }[];
}

export interface QuickFilter {
  id: string;
  label: string;
  description: string;
  filter: Partial<FeeSearchFilter>;
  icon?: string;
}

class FeeSearchService {
  private searchIndex: Map<string, SearchableItem> = new Map();
  private stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
  ]);

  /**
   * Index import fees for search
   */
  indexImportFees(fees: ImportFee[]): void {
    fees.forEach((fee) => {
      const searchableText = [
        fee.description || '',
        fee.category || '',
        fee.supplier || '',
        fee.notes || '',
        fee.amount.toString(),
        fee.currency || 'VND',
      ]
        .join(' ')
        .toLowerCase();

      this.searchIndex.set(`import_fee_${fee.id}`, {
        id: fee.id,
        type: 'import_fee',
        searchableText,
        metadata: {
          importPhaseId: fee.importPhaseId,
          amount: fee.amount,
          currency: fee.currency,
          date: fee.date,
          category: fee.category,
          supplier: fee.supplier,
        },
      });
    });
  }

  /**
   * Index channel fee structures for search
   */
  indexChannelFees(feeStructures: ChannelFeeStructure[]): void {
    feeStructures.forEach((structure) => {
      const searchableText = [
        structure.name || '',
        structure.channel || '',
        structure.description || '',
        structure.feeType || '',
        structure.feeValue.toString(),
      ]
        .join(' ')
        .toLowerCase();

      this.searchIndex.set(`channel_fee_${structure.id}`, {
        id: structure.id,
        type: 'channel_fee',
        searchableText,
        metadata: {
          channel: structure.channel,
          feeType: structure.feeType,
          feeValue: structure.feeValue,
          isActive: structure.isActive,
          name: structure.name,
        },
      });
    });
  }

  /**
   * Index products with fee calculations for search
   */
  indexProductsWithFees(products: Product[]): void {
    products.forEach((product) => {
      const searchableText = [
        product.name || '',
        product.description || '',
        product.category || '',
        product.sku || '',
        product.tags?.join(' ') || '',
      ]
        .join(' ')
        .toLowerCase();

      this.searchIndex.set(`product_${product.id}`, {
        id: product.id,
        type: 'product',
        searchableText,
        metadata: {
          name: product.name,
          category: product.category,
          sku: product.sku,
          tags: product.tags,
          hasImportFees: product.importFees
            ? product.importFees.length > 0
            : false,
          price: product.price,
        },
      });
    });
  }

  /**
   * Tokenize search query
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 1 && !this.stopWords.has(token));
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevance(
    item: SearchableItem,
    queryTokens: string[]
  ): number {
    if (queryTokens.length === 0) {
      return 1;
    }

    const itemTokens = this.tokenize(item.searchableText);
    let score = 0;
    const matchedTerms = new Set<string>();

    queryTokens.forEach((queryToken) => {
      // Exact match gets highest score
      if (itemTokens.includes(queryToken)) {
        score += 10;
        matchedTerms.add(queryToken);
      } else {
        // Partial matches get lower scores
        itemTokens.forEach((itemToken) => {
          if (itemToken.includes(queryToken)) {
            score += 5;
            matchedTerms.add(queryToken);
          } else if (queryToken.includes(itemToken)) {
            score += 3;
            matchedTerms.add(queryToken);
          }
        });
      }
    });

    // Boost score based on match completeness
    const matchRatio = matchedTerms.size / queryTokens.length;
    score *= 1 + matchRatio;

    return score;
  }

  /**
   * Apply filters to search results
   */
  private applyFilters(
    items: SearchableItem[],
    filter: FeeSearchFilter
  ): SearchableItem[] {
    return items.filter((item) => {
      // Fee type filter
      if (filter.feeType && filter.feeType !== 'all') {
        if (filter.feeType === 'import' && item.type !== 'import_fee') {
          return false;
        }
        if (filter.feeType === 'channel' && item.type !== 'channel_fee') {
          return false;
        }
      }

      // Import phase filter
      if (
        filter.importPhase &&
        item.metadata?.importPhaseId !== filter.importPhase
      ) {
        return false;
      }

      // Channel filter
      if (filter.channel && item.metadata?.channel !== filter.channel) {
        return false;
      }

      // Currency filter
      if (filter.currency && item.metadata?.currency !== filter.currency) {
        return false;
      }

      // Status filter
      if (filter.status && filter.status !== 'all') {
        const isActive = item.metadata?.isActive;
        if (filter.status === 'active' && !isActive) {
          return false;
        }
        if (filter.status === 'inactive' && isActive) {
          return false;
        }
      }

      // Amount range filter
      if (filter.amountFrom !== undefined || filter.amountTo !== undefined) {
        const amount = item.metadata?.amount as number;
        if (amount === undefined) {
          return false;
        }
        if (filter.amountFrom !== undefined && amount < filter.amountFrom) {
          return false;
        }
        if (filter.amountTo !== undefined && amount > filter.amountTo) {
          return false;
        }
      }

      // Date range filter
      if (filter.dateFrom || filter.dateTo) {
        const date = item.metadata?.date as Date;
        if (!date) {
          return false;
        }
        if (filter.dateFrom && date < filter.dateFrom) {
          return false;
        }
        if (filter.dateTo && date > filter.dateTo) {
          return false;
        }
      }

      // Has calculations filter
      if (filter.hasCalculations !== undefined) {
        const hasCalc = Boolean(item.metadata?.hasImportFees);
        if (filter.hasCalculations !== hasCalc) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Generate search facets
   */
  private generateFacets(items: SearchableItem[]): SearchFacets {
    const feeTypes = new Map<string, number>();
    const channels = new Map<string, number>();
    const importPhases = new Map<string, number>();
    const currencies = new Map<string, number>();
    const amountRanges = new Map<string, number>();

    items.forEach((item) => {
      // Fee types
      const feeType =
        item.type === 'import_fee'
          ? 'Import Fee'
          : item.type === 'channel_fee'
            ? 'Channel Fee'
            : item.type === 'product'
              ? 'Product'
              : 'Calculation';
      feeTypes.set(feeType, (feeTypes.get(feeType) || 0) + 1);

      // Channels
      if (item.metadata?.channel) {
        const channel = item.metadata.channel as string;
        channels.set(channel, (channels.get(channel) || 0) + 1);
      }

      // Import phases
      if (item.metadata?.importPhaseId) {
        const phase = item.metadata.importPhaseId as string;
        importPhases.set(phase, (importPhases.get(phase) || 0) + 1);
      }

      // Currencies
      if (item.metadata?.currency) {
        const currency = item.metadata.currency as string;
        currencies.set(currency, (currencies.get(currency) || 0) + 1);
      }

      // Amount ranges
      if (item.metadata?.amount) {
        const amount = item.metadata.amount as number;
        let range = '';
        if (amount < 100000) {
          range = 'Under 100K';
        } else if (amount < 500000) {
          range = '100K - 500K';
        } else if (amount < 1000000) {
          range = '500K - 1M';
        } else if (amount < 5000000) {
          range = '1M - 5M';
        } else {
          range = 'Over 5M';
        }

        amountRanges.set(range, (amountRanges.get(range) || 0) + 1);
      }
    });

    return {
      feeTypes: Array.from(feeTypes.entries()).map(([value, count]) => ({
        value,
        count,
      })),
      channels: Array.from(channels.entries()).map(([value, count]) => ({
        value,
        count,
      })),
      importPhases: Array.from(importPhases.entries()).map(
        ([value, count]) => ({ value, count })
      ),
      currencies: Array.from(currencies.entries()).map(([value, count]) => ({
        value,
        count,
      })),
      amountRanges: Array.from(amountRanges.entries()).map(
        ([range, count]) => ({ range, count })
      ),
      dateRanges: [], // Would need actual date analysis
    };
  }

  /**
   * Perform comprehensive search
   */
  search<T = unknown>(filter: FeeSearchFilter): SearchResponse<T> {
    const queryTokens = filter.query ? this.tokenize(filter.query) : [];
    let items = Array.from(this.searchIndex.values());

    // Apply filters
    items = this.applyFilters(items, filter);

    // Calculate relevance and create search results
    const results: SearchResult<T>[] = items
      .map((item) => {
        const relevanceScore = this.calculateRelevance(item, queryTokens);
        return {
          item: item as T,
          type: item.type,
          relevanceScore,
          matchedFields: [], // Would need more detailed analysis
          highlights: [], // Would need highlighting logic
        };
      })
      .filter((result) => (filter.query ? result.relevanceScore > 0 : true));

    // Sort results
    const sortBy = filter.sortBy || 'relevance';
    const sortOrder = filter.sortOrder || 'desc';

    results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'relevance':
          comparison = a.relevanceScore - b.relevanceScore;
          break;
        case 'amount':
          const amountA =
            ((a.item as SearchableItem)?.metadata?.amount as number) || 0;
          const amountB =
            ((b.item as SearchableItem)?.metadata?.amount as number) || 0;
          comparison = amountA - amountB;
          break;
        case 'date':
          const dateA =
            ((a.item as SearchableItem)?.metadata?.date as Date) || new Date(0);
          const dateB =
            ((b.item as SearchableItem)?.metadata?.date as Date) || new Date(0);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'name':
          const nameA =
            ((a.item as SearchableItem)?.metadata?.name as string) || '';
          const nameB =
            ((b.item as SearchableItem)?.metadata?.name as string) || '';
          comparison = nameA.localeCompare(nameB);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Pagination
    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;
    const totalResults = results.length;
    const totalPages = Math.ceil(totalResults / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedResults = results.slice(startIndex, startIndex + pageSize);

    // Generate facets
    const facets = this.generateFacets(items);

    return {
      results: paginatedResults,
      totalResults,
      totalPages,
      currentPage: page,
      facets,
      suggestions: this.generateSuggestions(filter.query || ''),
    };
  }

  /**
   * Generate search suggestions
   */
  private generateSuggestions(query: string): string[] {
    if (!query || query.length < 2) {
      return [];
    }

    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    // Extract terms from search index
    this.searchIndex.forEach((item) => {
      const words = this.tokenize(item.searchableText);
      words.forEach((word) => {
        if (word.startsWith(queryLower) && word !== queryLower) {
          suggestions.add(word);
        }
      });
    });

    return Array.from(suggestions).slice(0, 5);
  }

  /**
   * Get predefined quick filters
   */
  getQuickFilters(): QuickFilter[] {
    return [
      {
        id: 'recent_fees',
        label: 'Recent Fees',
        description: 'Fees added in the last 30 days',
        filter: {
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          sortBy: 'date',
          sortOrder: 'desc',
        },
        icon: 'clock',
      },
      {
        id: 'high_value_fees',
        label: 'High Value Fees',
        description: 'Fees over 1M VND',
        filter: {
          amountFrom: 1000000,
          sortBy: 'amount',
          sortOrder: 'desc',
        },
        icon: 'trending-up',
      },
      {
        id: 'import_fees_only',
        label: 'Import Fees',
        description: 'Import fees only',
        filter: {
          feeType: 'import',
          sortBy: 'date',
          sortOrder: 'desc',
        },
        icon: 'package',
      },
      {
        id: 'channel_fees_only',
        label: 'Channel Fees',
        description: 'Channel fees only',
        filter: {
          feeType: 'channel',
          sortBy: 'name',
          sortOrder: 'asc',
        },
        icon: 'globe',
      },
      {
        id: 'active_structures',
        label: 'Active Fee Structures',
        description: 'Currently active fee structures',
        filter: {
          status: 'active',
          sortBy: 'name',
          sortOrder: 'asc',
        },
        icon: 'check-circle',
      },
    ];
  }

  /**
   * Export search results
   */
  exportResults<T>(
    searchResponse: SearchResponse<T>,
    format: 'csv' | 'json' = 'csv'
  ): string {
    if (format === 'json') {
      return JSON.stringify(searchResponse, null, 2);
    }

    // CSV export
    const headers = [
      'Type',
      'ID',
      'Name',
      'Amount',
      'Currency',
      'Date',
      'Relevance Score',
    ];
    const rows = searchResponse.results.map((result) => {
      const metadata = (result.item as SearchableItem)?.metadata || {};
      return [
        result.type,
        (result.item as SearchableItem)?.id || '',
        metadata.name || '',
        metadata.amount || '',
        metadata.currency || '',
        metadata.date
          ? new Date(metadata.date as Date).toISOString().split('T')[0]
          : '',
        result.relevanceScore.toFixed(2),
      ]
        .map((field) => `"${field}"`)
        .join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Clear search index
   */
  clearIndex(): void {
    this.searchIndex.clear();
  }

  /**
   * Get search statistics
   */
  getSearchStats(): {
    totalIndexedItems: number;
    itemsByType: Record<string, number>;
    indexSize: number;
  } {
    const itemsByType: Record<string, number> = {};

    this.searchIndex.forEach((item) => {
      itemsByType[item.type] = (itemsByType[item.type] || 0) + 1;
    });

    return {
      totalIndexedItems: this.searchIndex.size,
      itemsByType,
      indexSize: JSON.stringify(Array.from(this.searchIndex.values())).length,
    };
  }
}

// Export singleton instance
export const feeSearchService = new FeeSearchService();
