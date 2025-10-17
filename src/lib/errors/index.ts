/**
 * Enhanced Error Types for Product Variants and Revenue Tracking
 * Custom error classes for better error handling and user feedback
 */

/**
 * Base application error class
 */
abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Product Variant related errors
 */
class VariantError extends AppError {
  readonly code = 'VARIANT_ERROR';
  readonly statusCode = 400;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * SKU related errors
 */
class SKUError extends AppError {
  readonly code = 'SKU_ERROR';
  readonly statusCode = 400;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Variant uniqueness violation errors
 */
class VariantUniquenessError extends AppError {
  readonly code = 'VARIANT_UNIQUENESS_ERROR';
  readonly statusCode = 409; // Conflict

  constructor(
    message: string,
    public readonly conflictingVariant?: Record<string, unknown>,
    context?: Record<string, unknown>
  ) {
    super(message, { ...context, conflictingVariant });
  }
}

/**
 * Variant inventory related errors
 */
class VariantInventoryError extends AppError {
  readonly code = 'VARIANT_INVENTORY_ERROR';
  readonly statusCode = 400;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Variant not found errors
 */
class VariantNotFoundError extends AppError {
  readonly code = 'VARIANT_NOT_FOUND';
  readonly statusCode = 404;

  constructor(variantId: string, context?: Record<string, unknown>) {
    super(`Product variant not found: ${variantId}`, { ...context, variantId });
  }
}

/**
 * Revenue tracking related errors
 */
class RevenueError extends AppError {
  readonly code = 'REVENUE_ERROR';
  readonly statusCode = 400;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Revenue entry validation errors
 */
class RevenueValidationError extends AppError {
  readonly code = 'REVENUE_VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Sales channel related errors
 */
class SalesChannelError extends AppError {
  readonly code = 'SALES_CHANNEL_ERROR';
  readonly statusCode = 400;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Sales channel not found errors
 */
class SalesChannelNotFoundError extends AppError {
  readonly code = 'SALES_CHANNEL_NOT_FOUND';
  readonly statusCode = 404;

  constructor(channelId: string, context?: Record<string, unknown>) {
    super(`Sales channel not found: ${channelId}`, { ...context, channelId });
  }
}

/**
 * Revenue calculation errors
 */
class RevenueCalculationError extends AppError {
  readonly code = 'REVENUE_CALCULATION_ERROR';
  readonly statusCode = 400;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Storage related errors
 */
class StorageError extends AppError {
  readonly code = 'STORAGE_ERROR';
  readonly statusCode = 500;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Data migration errors
 */
class MigrationError extends AppError {
  readonly code = 'MIGRATION_ERROR';
  readonly statusCode = 500;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Validation schema errors
 */
class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly field?: string,
    public readonly validationErrors?: string[],
    context?: Record<string, unknown>
  ) {
    super(message, { ...context, field, validationErrors });
  }
}

/**
 * Business rule violation errors
 */
class BusinessRuleError extends AppError {
  readonly code = 'BUSINESS_RULE_ERROR';
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly rule: string,
    context?: Record<string, unknown>
  ) {
    super(message, { ...context, rule });
  }
}

/**
 * Inventory insufficient errors
 */
class InsufficientInventoryError extends AppError {
  readonly code = 'INSUFFICIENT_INVENTORY';
  readonly statusCode = 400;

  constructor(
    variantId: string,
    requested: number,
    available: number,
    context?: Record<string, unknown>
  ) {
    super(
      `Insufficient inventory for variant ${variantId}. Requested: ${requested}, Available: ${available}`,
      { ...context, variantId, requested, available }
    );
  }
}

/**
 * Error factory functions for common scenarios
 */
export const ErrorFactory = {
  /**
   * Create SKU already exists error
   */
  skuAlreadyExists(sku: string, existingVariantId?: string): SKUError {
    return new SKUError(`SKU already exists: ${sku}`, {
      sku,
      existingVariantId,
    });
  },

  /**
   * Create variant combination already exists error
   */
  variantCombinationExists(
    productId: string,
    size: string,
    form: string,
    color: string,
    existingVariantId?: string
  ): VariantUniquenessError {
    return new VariantUniquenessError(
      `Variant combination already exists: ${size}-${form}-${color} for product ${productId}`,
      { id: existingVariantId },
      { productId, size, form, color }
    );
  },

  /**
   * Create invalid SKU format error
   */
  invalidSKUFormat(sku: string, reason: string): SKUError {
    return new SKUError(`Invalid SKU format: ${sku}. ${reason}`, {
      sku,
      reason,
    });
  },

  /**
   * Create revenue entry validation error
   */
  invalidRevenueEntry(
    field: string,
    value: unknown,
    reason: string
  ): RevenueValidationError {
    return new RevenueValidationError(
      `Invalid revenue entry: ${field} = ${value}. ${reason}`,
      { field, value, reason }
    );
  },

  /**
   * Create sales channel inactive error
   */
  salesChannelInactive(
    channelId: string,
    channelName: string
  ): SalesChannelError {
    return new SalesChannelError(`Sales channel is inactive: ${channelName}`, {
      channelId,
      channelName,
    });
  },

  /**
   * Create data migration error
   */
  migrationFailed(
    fromVersion: string,
    toVersion: string,
    reason: string
  ): MigrationError {
    return new MigrationError(
      `Failed to migrate data from version ${fromVersion} to ${toVersion}: ${reason}`,
      { fromVersion, toVersion, reason }
    );
  },

  /**
   * Create validation error from Zod error
   */
  fromZodError(zodError: {
    issues: { path: string[]; message: string }[];
  }): ValidationError {
    const errors = zodError.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`
    );
    return new ValidationError(
      'Validation failed',
      zodError.issues[0]?.path.join('.'),
      errors
    );
  },
};

/**
 * Error handler utility functions
 */
export const ErrorUtils = {
  /**
   * Check if error is an instance of AppError
   */
  isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  },

  /**
   * Check if error is a variant related error
   */
  isVariantError(error: unknown): error is VariantError {
    return error instanceof VariantError;
  },

  /**
   * Check if error is a revenue related error
   */
  isRevenueError(error: unknown): error is RevenueError {
    return error instanceof RevenueError;
  },

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: unknown): string {
    if (error instanceof AppError) {
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An unexpected error occurred';
  },

  /**
   * Get error code for logging/tracking
   */
  getErrorCode(error: unknown): string {
    if (error instanceof AppError) {
      return error.code;
    }

    return 'UNKNOWN_ERROR';
  },

  /**
   * Convert error to safe JSON for API responses
   */
  toApiResponse(error: unknown): {
    error: string;
    code: string;
    message: string;
    statusCode: number;
  } {
    if (error instanceof AppError) {
      return {
        error: error.name,
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    return {
      error: 'UnknownError',
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      statusCode: 500,
    };
  },
};

// Re-export all error classes
export {
  AppError,
  VariantError,
  SKUError,
  VariantUniquenessError,
  VariantInventoryError,
  VariantNotFoundError,
  RevenueError,
  RevenueValidationError,
  SalesChannelError,
  SalesChannelNotFoundError,
  RevenueCalculationError,
  StorageError,
  MigrationError,
  ValidationError,
  BusinessRuleError,
  InsufficientInventoryError,
};
