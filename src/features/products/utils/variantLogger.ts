/**
 * Variant Operations Logging
 * T028 [US1] - Add logging for variant operations
 */

import type { ProductVariant } from '@/types';
import type {
  CreateProductVariantData,
  UpdateProductVariantData,
  VariantInventoryUpdate,
} from '@/features/products/types/variants';

interface VariantLogEntry {
  id: string;
  timestamp: Date;
  operation: string;
  variantId?: string;
  productId: string;
  data: Record<string, unknown>;
  result: 'success' | 'error' | 'warning';
  duration?: number;
  error?: string;
  user?: string;
}

interface VariantLogFilter {
  productId?: string;
  variantId?: string;
  operation?: string;
  result?: 'success' | 'error' | 'warning';
  since?: Date;
  limit?: number;
}

export interface VariantOperationContext {
  userId?: string;
  sessionId?: string;
  source?: 'ui' | 'api' | 'import' | 'system';
  metadata?: Record<string, string | number | boolean>;
}

class VariantLogger {
  private logs: VariantLogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 log entries

  /**
   * Log variant creation
   */
  logVariantCreation(
    data: CreateProductVariantData,
    result: ProductVariant | null,
    context?: VariantOperationContext,
    error?: string,
    duration?: number
  ): void {
    this.addLog({
      operation: 'create_variant',
      productId: data.productId,
      variantId: result?.id,
      data: {
        color: data.color,
        size: data.size,
        form: data.form,
        inventoryCount: data.inventoryCount,
      },
      result: error ? 'error' : 'success',
      error,
      duration,
      ...context,
    });
  }

  /**
   * Log variant update
   */
  logVariantUpdate(
    variantId: string,
    productId: string,
    updates: UpdateProductVariantData,
    result: ProductVariant | null,
    context?: VariantOperationContext,
    error?: string,
    duration?: number
  ): void {
    this.addLog({
      operation: 'update_variant',
      variantId,
      productId,
      data: updates as Record<string, unknown>,
      result: error ? 'error' : 'success',
      error,
      duration,
      ...context,
    });
  }

  /**
   * Log variant deletion
   */
  logVariantDeletion(
    variantId: string,
    productId: string,
    success: boolean,
    context?: VariantOperationContext,
    error?: string,
    duration?: number
  ): void {
    this.addLog({
      operation: 'delete_variant',
      variantId,
      productId,
      data: context?.metadata || {},
      result: error || !success ? 'error' : 'success',
      error,
      duration,
      ...context,
    });
  }

  /**
   * Log inventory update
   */
  logInventoryUpdate(
    variantId: string,
    productId: string,
    update: VariantInventoryUpdate,
    result: ProductVariant | null,
    context?: VariantOperationContext,
    error?: string,
    duration?: number
  ): void {
    this.addLog({
      operation: 'update_inventory',
      variantId,
      productId,
      data: {
        operation: update.operation,
        quantity: update.quantity,
        reason: update.reason,
      },
      result: error ? 'error' : 'success',
      error,
      duration,
      ...context,
    });
  }

  /**
   * Log bulk operations
   */
  logBulkOperation(
    operation: string,
    productId: string,
    totalAttempted: number,
    successCount: number,
    failureCount: number,
    context?: VariantOperationContext,
    duration?: number
  ): void {
    this.addLog({
      operation: `bulk_${operation}`,
      productId,
      data: {
        totalAttempted,
        successCount,
        failureCount,
        successRate: `${((successCount / totalAttempted) * 100).toFixed(1)}%`,
      },
      result: failureCount > 0 ? 'warning' : 'success',
      duration,
      ...context,
    });
  }

  /**
   * Log validation errors
   */
  logValidationError(
    operation: string,
    productId: string,
    variantId: string | undefined,
    validationErrors: string[],
    context?: VariantOperationContext
  ): void {
    this.addLog({
      operation: `validation_${operation}`,
      variantId,
      productId,
      data: {
        validationErrors,
        errorCount: validationErrors.length,
      },
      result: 'error',
      error: `Validation failed: ${validationErrors.join(', ')}`,
      ...context,
    });
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetric(
    operation: string,
    duration: number,
    recordCount?: number,
    context?: VariantOperationContext
  ): void {
    this.addLog({
      operation: `perf_${operation}`,
      productId: 'system',
      data: {
        duration,
        recordCount,
        avgPerRecord: recordCount ? duration / recordCount : undefined,
      },
      result: duration > 5000 ? 'warning' : 'success',
      duration,
      ...context,
    });
  }

  /**
   * Add a log entry (exposed for external use)
   */
  public log(entry: Omit<VariantLogEntry, 'id' | 'timestamp'>): void {
    this.addLog(entry);
  }

  /**
   * Add a log entry (internal method)
   */
  private addLog(entry: Omit<VariantLogEntry, 'id' | 'timestamp'>): void {
    const logEntry: VariantLogEntry = {
      ...entry,
      id:
        entry.variantId ||
        `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.logs.push(logEntry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(logEntry);
    }

    // Could extend to send to external logging service
    // this.sendToExternalLogger(logEntry);
  }

  /**
   * Log to console with appropriate level
   */
  private logToConsole(entry: VariantLogEntry): void {
    const logMessage = `[Variant] ${entry.operation} - ${entry.result}`;
    const logData = {
      timestamp: entry.timestamp.toISOString(),
      variantId: entry.variantId,
      productId: entry.productId,
      data: entry.data,
      duration: entry.duration,
      error: entry.error,
    };

    switch (entry.result) {
      case 'error':
        console.error(logMessage, logData);
        break;
      case 'warning':
        console.warn(logMessage, logData);
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(logMessage, logData);
        break;
    }
  }

  /**
   * Get logs with optional filtering
   */
  getLogs(filter?: VariantLogFilter): VariantLogEntry[] {
    let logs = [...this.logs];

    if (filter) {
      if (filter.productId) {
        logs = logs.filter((log) => log.productId === filter.productId);
      }

      if (filter.variantId) {
        logs = logs.filter((log) => log.variantId === filter.variantId);
      }

      if (filter.operation) {
        logs = logs.filter((log) =>
          log.operation.includes(filter.operation as string)
        );
      }

      if (filter.result) {
        logs = logs.filter((log) => log.result === filter.result);
      }

      if (filter.since) {
        logs = logs.filter((log) => log.timestamp >= (filter.since as Date));
      }

      if (filter.limit) {
        logs = logs.slice(-filter.limit);
      }
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get operation statistics
   */
  getOperationStats(productId?: string): Record<string, unknown> {
    const relevantLogs = productId
      ? this.logs.filter((log) => log.productId === productId)
      : this.logs;

    const stats = {
      totalOperations: relevantLogs.length,
      operationTypes: {} as Record<string, number>,
      resultCounts: {
        success: 0,
        error: 0,
        warning: 0,
      },
      averageDuration: 0,
      recentErrors: [] as VariantLogEntry[],
    };

    let totalDuration = 0;
    let durationCount = 0;

    for (const log of relevantLogs) {
      // Count operation types
      stats.operationTypes[log.operation] =
        (stats.operationTypes[log.operation] || 0) + 1;

      // Count results
      if (log.result) {
        stats.resultCounts[log.result]++;
      }

      // Calculate average duration
      if (log.duration) {
        totalDuration += log.duration;
        durationCount++;
      }

      // Collect recent errors
      if (log.result === 'error' && stats.recentErrors.length < 5) {
        stats.recentErrors.push(log);
      }
    }

    if (durationCount > 0) {
      stats.averageDuration = Math.round(totalDuration / durationCount);
    }

    return stats;
  }

  /**
   * Export logs for analysis
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'timestamp',
        'operation',
        'variantId',
        'productId',
        'result',
        'duration',
        'error',
      ];
      const rows = this.logs.map((log) => [
        log.timestamp.toISOString(),
        log.operation,
        log.variantId || '',
        log.productId,
        log.result || '',
        log.duration || '',
        log.error || '',
      ]);

      return [headers, ...rows].map((row) => row.join(',')).join('\n');
    }

    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}

// Create singleton instance
export const variantLogger = new VariantLogger();

/**
 * Utility function to measure operation duration
 */
export function measureDuration<T>(
  operation: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();

  return operation().then((result) => ({
    result,
    duration: Date.now() - startTime,
  }));
}

/**
 * Decorator for logging variant operations
 */
export function withVariantLogging<TArgs extends unknown[], TReturn>(
  operation: string,
  fn: (...args: TArgs) => Promise<TReturn>,
  getContext?: (...args: TArgs) => {
    productId: string;
    variantId?: string;
    context?: VariantOperationContext;
  }
) {
  return async (...args: TArgs): Promise<TReturn> => {
    const startTime = Date.now();
    let error: string | undefined;
    let result: TReturn;

    try {
      result = await fn(...args);
      return result;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      const duration = Date.now() - startTime;

      if (getContext) {
        const { productId, variantId, context } = getContext(...args);

        variantLogger.log({
          operation,
          productId,
          variantId,
          data: context?.metadata || {},
          result: error ? 'error' : 'success',
          error,
          duration,
          ...context,
        });
      }
    }
  };
}

/**
 * Hook for accessing variant logs in components
 */
export function useVariantLogs(productId?: string) {
  const getLogs = (filter?: Partial<VariantLogFilter>) =>
    variantLogger.getLogs({ ...filter, productId });
  const getStats = () => variantLogger.getOperationStats(productId);
  const exportLogs = (format?: 'json' | 'csv') =>
    variantLogger.exportLogs(format);

  return {
    getLogs,
    getStats,
    exportLogs,
    clearLogs: () => variantLogger.clearLogs(),
  };
}
