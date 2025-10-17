/**
 * Audit Service
 * Provides comprehensive audit trail functionality for fee operations
 * Implements T038 - Fee audit trail validation
 */

export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  changes: AuditChange[];
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'calculate'
  | 'apply'
  | 'configure'
  | 'export'
  | 'import';

export type AuditEntityType =
  | 'import_fee'
  | 'channel_fee_structure'
  | 'revenue_entry'
  | 'product'
  | 'import_phase'
  | 'fee_calculation';

export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: 'create' | 'update' | 'delete';
}

export interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
}

export interface AuditSummary {
  totalEntries: number;
  dateRange: {
    from: Date;
    to: Date;
  };
  actionCounts: Record<AuditAction, number>;
  entityTypeCounts: Record<AuditEntityType, number>;
  userActivity: Record<string, number>;
}

class AuditService {
  private auditLog: AuditEntry[] = [];
  private readonly storageKey = 'clothing-store-audit-log';

  constructor() {
    this.loadAuditLog();
  }

  /**
   * Load audit log from localStorage
   */
  private loadAuditLog(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as (Omit<AuditEntry, 'timestamp'> & {
          timestamp: string;
        })[];
        this.auditLog = parsed.map((entry) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load audit log:', error);
      this.auditLog = [];
    }
  }

  /**
   * Save audit log to localStorage
   */
  private saveAuditLog(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.auditLog));
    } catch (error) {
      console.error('Failed to save audit log:', error);
    }
  }

  /**
   * Generate unique ID for audit entry
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log an audit entry
   */
  log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
    const auditEntry: AuditEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      ...entry,
    };

    this.auditLog.push(auditEntry);
    this.saveAuditLog();

    // Keep only last 10,000 entries to prevent storage bloat
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-10000);
      this.saveAuditLog();
    }
  }

  /**
   * Log import fee changes
   */
  logImportFeeChange(
    action: AuditAction,
    importPhaseId: string,
    feeId: string,
    changes: AuditChange[],
    metadata?: Record<string, unknown>
  ): void {
    this.log({
      action,
      entityType: 'import_fee',
      entityId: feeId,
      changes,
      metadata: {
        importPhaseId,
        ...metadata,
      },
    });
  }

  /**
   * Log channel fee structure changes
   */
  logChannelFeeChange(
    action: AuditAction,
    channelId: string,
    feeStructureId: string,
    changes: AuditChange[],
    metadata?: Record<string, unknown>
  ): void {
    this.log({
      action,
      entityType: 'channel_fee_structure',
      entityId: feeStructureId,
      changes,
      metadata: {
        channelId,
        ...metadata,
      },
    });
  }

  /**
   * Log fee calculation events
   */
  logFeeCalculation(
    entityType: 'import_fee' | 'channel_fee_structure',
    entityId: string,
    calculationData: {
      amount: number;
      feeAmount: number;
      netAmount?: number;
    },
    metadata?: Record<string, unknown>
  ): void {
    this.log({
      action: 'calculate',
      entityType: 'fee_calculation',
      entityId: `calc_${entityType}_${entityId}`,
      changes: [
        {
          field: 'calculation',
          oldValue: null,
          newValue: calculationData,
          changeType: 'create',
        },
      ],
      metadata: {
        sourceEntityType: entityType,
        sourceEntityId: entityId,
        ...metadata,
      },
    });
  }

  /**
   * Log revenue entry with fee application
   */
  logRevenueWithFees(
    action: AuditAction,
    revenueEntryId: string,
    changes: AuditChange[],
    feeData?: {
      channelFee?: number;
      netAmount?: number;
    }
  ): void {
    this.log({
      action,
      entityType: 'revenue_entry',
      entityId: revenueEntryId,
      changes,
      metadata: {
        hasFees: !!feeData,
        feeData,
      },
    });
  }

  /**
   * Get audit entries with optional filtering
   */
  getAuditEntries(filter?: AuditFilter): AuditEntry[] {
    let entries = [...this.auditLog];

    if (filter) {
      if (filter.startDate) {
        const startDate = filter.startDate;
        entries = entries.filter((entry) => entry.timestamp >= startDate);
      }
      if (filter.endDate) {
        const endDate = filter.endDate;
        entries = entries.filter((entry) => entry.timestamp <= endDate);
      }
      if (filter.userId) {
        entries = entries.filter((entry) => entry.userId === filter.userId);
      }
      if (filter.action) {
        entries = entries.filter((entry) => entry.action === filter.action);
      }
      if (filter.entityType) {
        entries = entries.filter(
          (entry) => entry.entityType === filter.entityType
        );
      }
      if (filter.entityId) {
        entries = entries.filter((entry) => entry.entityId === filter.entityId);
      }
    }

    return entries.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Get audit summary statistics
   */
  getAuditSummary(filter?: AuditFilter): AuditSummary {
    const entries = this.getAuditEntries(filter);

    if (entries.length === 0) {
      return {
        totalEntries: 0,
        dateRange: { from: new Date(), to: new Date() },
        actionCounts: {} as Record<AuditAction, number>,
        entityTypeCounts: {} as Record<AuditEntityType, number>,
        userActivity: {},
      };
    }

    const actionCounts: Record<string, number> = {};
    const entityTypeCounts: Record<string, number> = {};
    const userActivity: Record<string, number> = {};

    entries.forEach((entry) => {
      // Count actions
      actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;

      // Count entity types
      entityTypeCounts[entry.entityType] =
        (entityTypeCounts[entry.entityType] || 0) + 1;

      // Count user activity
      if (entry.userId) {
        userActivity[entry.userId] = (userActivity[entry.userId] || 0) + 1;
      }
    });

    const timestamps = entries.map((e) => e.timestamp.getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);

    return {
      totalEntries: entries.length,
      dateRange: {
        from: new Date(minTime),
        to: new Date(maxTime),
      },
      actionCounts: actionCounts as Record<AuditAction, number>,
      entityTypeCounts: entityTypeCounts as Record<AuditEntityType, number>,
      userActivity,
    };
  }

  /**
   * Export audit log for compliance/reporting
   */
  exportAuditLog(filter?: AuditFilter): string {
    const entries = this.getAuditEntries(filter);

    const csvHeader = [
      'Timestamp',
      'Action',
      'Entity Type',
      'Entity ID',
      'Changes',
      'User ID',
      'IP Address',
    ].join(',');

    const csvRows = entries.map((entry) =>
      [
        entry.timestamp.toISOString(),
        entry.action,
        entry.entityType,
        entry.entityId,
        JSON.stringify(entry.changes).replace(/"/g, '""'), // Escape quotes for CSV
        entry.userId || '',
        entry.ipAddress || '',
      ]
        .map((field) => `"${field}"`)
        .join(',')
    );

    return [csvHeader, ...csvRows].join('\n');
  }

  /**
   * Clear old audit entries (for maintenance)
   */
  clearOldEntries(olderThanDays: number = 365): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const initialCount = this.auditLog.length;
    this.auditLog = this.auditLog.filter(
      (entry) => entry.timestamp > cutoffDate
    );

    const removedCount = initialCount - this.auditLog.length;
    if (removedCount > 0) {
      this.saveAuditLog();
    }

    return removedCount;
  }

  /**
   * Verify audit log integrity
   */
  verifyIntegrity(): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for duplicate IDs
    const ids = this.auditLog.map((entry) => entry.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      issues.push('Duplicate audit entry IDs found');
    }

    // Check chronological order
    for (let i = 1; i < this.auditLog.length; i++) {
      if (this.auditLog[i].timestamp > this.auditLog[i - 1].timestamp) {
        issues.push('Audit entries are not in chronological order');
        break;
      }
    }

    // Check for required fields
    this.auditLog.forEach((entry, index) => {
      if (!entry.id) {
        issues.push(`Entry ${index}: Missing ID`);
      }
      if (!entry.timestamp) {
        issues.push(`Entry ${index}: Missing timestamp`);
      }
      if (!entry.action) {
        issues.push(`Entry ${index}: Missing action`);
      }
      if (!entry.entityType) {
        issues.push(`Entry ${index}: Missing entity type`);
      }
      if (!entry.entityId) {
        issues.push(`Entry ${index}: Missing entity ID`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}

// Export singleton instance
export const auditService = new AuditService();
