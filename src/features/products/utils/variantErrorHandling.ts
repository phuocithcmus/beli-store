/**
 * Enhanced Variant Error Handling and Validation
 * T027 [US1] - Add variant-specific validation and error handling
 */

import type { ProductVariant } from '@/types';
import type { ProductVariantFormData } from '@/features/products/types/variants';

export interface ValidationError {
  field?: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Enhanced form validation with specific error messages
 */
export function validateVariantForm(
  formData: ProductVariantFormData
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Color validation
  if (!formData.color || formData.color.trim().length === 0) {
    errors.push({
      field: 'color',
      message: 'Color is required',
      code: 'REQUIRED_FIELD',
      severity: 'error',
    });
  } else if (formData.color.trim().length < 2) {
    errors.push({
      field: 'color',
      message: 'Color must be at least 2 characters long',
      code: 'MIN_LENGTH',
      severity: 'error',
    });
  } else if (formData.color.trim().length > 50) {
    errors.push({
      field: 'color',
      message: 'Color must not exceed 50 characters',
      code: 'MAX_LENGTH',
      severity: 'error',
    });
  }

  // Check for common color typos
  const colorLower = formData.color.toLowerCase().trim();
  const commonColors = [
    'red',
    'blue',
    'green',
    'yellow',
    'orange',
    'purple',
    'pink',
    'brown',
    'black',
    'white',
    'gray',
    'grey',
  ];
  const similarColors = commonColors.filter(
    (color) => color.includes(colorLower) || colorLower.includes(color)
  );

  if (similarColors.length > 0 && !commonColors.includes(colorLower)) {
    warnings.push({
      field: 'color',
      message: `Did you mean one of: ${similarColors.join(', ')}?`,
      code: 'SIMILAR_VALUE',
      severity: 'warning',
    });
  }

  // Size validation
  const validSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  if (!validSizes.includes(formData.size)) {
    warnings.push({
      field: 'size',
      message: `Unusual size '${formData.size}'. Standard sizes are: ${validSizes.join(', ')}`,
      code: 'UNUSUAL_VALUE',
      severity: 'warning',
    });
  }

  // Form validation
  const validForms = ['fit', 'oversized', 'slim', 'regular', 'loose'];
  if (!validForms.includes(formData.form)) {
    warnings.push({
      field: 'form',
      message: `Unusual form '${formData.form}'. Common forms are: ${validForms.join(', ')}`,
      code: 'UNUSUAL_VALUE',
      severity: 'warning',
    });
  }

  // Inventory validation
  if (formData.inventoryCount < 0) {
    errors.push({
      field: 'inventoryCount',
      message: 'Inventory count cannot be negative',
      code: 'NEGATIVE_VALUE',
      severity: 'error',
    });
  }

  if (formData.reservedCount < 0) {
    errors.push({
      field: 'reservedCount',
      message: 'Reserved count cannot be negative',
      code: 'NEGATIVE_VALUE',
      severity: 'error',
    });
  }

  if (formData.soldCount < 0) {
    errors.push({
      field: 'soldCount',
      message: 'Sold count cannot be negative',
      code: 'NEGATIVE_VALUE',
      severity: 'error',
    });
  }

  // Cross-field validation
  if (formData.reservedCount > formData.inventoryCount) {
    errors.push({
      field: 'reservedCount',
      message: 'Reserved count cannot exceed inventory count',
      code: 'INVALID_RELATIONSHIP',
      severity: 'error',
    });
  }

  if (formData.soldCount > formData.inventoryCount) {
    errors.push({
      field: 'soldCount',
      message: 'Sold count cannot exceed inventory count',
      code: 'INVALID_RELATIONSHIP',
      severity: 'error',
    });
  }

  const totalAllocated = formData.reservedCount + formData.soldCount;
  if (totalAllocated > formData.inventoryCount) {
    errors.push({
      field: 'inventoryCount',
      message: `Total allocated (${totalAllocated}) cannot exceed inventory (${formData.inventoryCount})`,
      code: 'INVALID_RELATIONSHIP',
      severity: 'error',
    });
  }

  // Business rule warnings
  const availableCount =
    formData.inventoryCount - formData.reservedCount - formData.soldCount;
  if (availableCount <= 0 && formData.inventoryCount > 0) {
    warnings.push({
      message: 'This variant will be out of stock when created',
      code: 'OUT_OF_STOCK',
      severity: 'warning',
    });
  } else if (availableCount <= 5 && availableCount > 0) {
    warnings.push({
      message: 'This variant will have low stock when created',
      code: 'LOW_STOCK',
      severity: 'warning',
    });
  }

  if (formData.inventoryCount > 1000) {
    warnings.push({
      field: 'inventoryCount',
      message: 'Large inventory count detected. Please verify this is correct.',
      code: 'LARGE_VALUE',
      severity: 'warning',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Enhanced variant conflict error messages
 */
export function formatVariantConflictError(
  existingVariant: ProductVariant
): string {
  return `A variant with color "${existingVariant.color}", size "${existingVariant.size}", and form "${existingVariant.form}" already exists (SKU: ${existingVariant.sku}). Each variant must have a unique combination of these attributes.`;
}

/**
 * Enhanced SKU conflict error messages
 */
export function formatSKUConflictError(
  sku: string,
  existingVariant: ProductVariant
): string {
  return `SKU "${sku}" is already used by another variant (${existingVariant.color} ${existingVariant.size} ${existingVariant.form}). SKUs must be unique across all variants.`;
}

/**
 * User-friendly error messages for common errors
 */
export function getUserFriendlyErrorMessage(error: string): string {
  // Map technical errors to user-friendly messages
  const errorMappings: Record<string, string> = {
    'Product not found':
      'The selected product no longer exists. Please refresh the page and try again.',
    'Variant not found':
      'This variant no longer exists. It may have been deleted by another user.',
    'Variant combination already exists':
      'A variant with this color, size, and form combination already exists for this product.',
    'SKU already exists':
      'This SKU is already in use by another variant. SKUs must be unique.',
    'Failed to create variant':
      'Unable to create the variant. Please check your input and try again.',
    'Failed to update variant':
      'Unable to save changes to this variant. Please try again.',
    'Failed to delete variant':
      'Unable to delete this variant. It may be referenced in orders or transactions.',
    'Invalid inventory operation':
      'The inventory operation is not valid. Please check the values and try again.',
    'Insufficient inventory':
      'There is not enough inventory to complete this operation.',
  };

  // Check for exact matches first
  if (errorMappings[error]) {
    return errorMappings[error];
  }

  // Check for partial matches
  for (const [key, message] of Object.entries(errorMappings)) {
    if (error.includes(key)) {
      return message;
    }
  }

  // Fallback to the original error if no mapping found
  return error;
}

/**
 * Enhanced error categorization
 */
export interface ErrorCategory {
  category: 'validation' | 'conflict' | 'system' | 'business' | 'network';
  action: 'retry' | 'correct' | 'refresh' | 'contact_support';
  recoverable: boolean;
}

export function categorizeError(error: string): ErrorCategory {
  const errorLower = error.toLowerCase();

  if (
    errorLower.includes('already exists') ||
    errorLower.includes('duplicate') ||
    errorLower.includes('conflict')
  ) {
    return {
      category: 'conflict',
      action: 'correct',
      recoverable: true,
    };
  }

  if (errorLower.includes('not found') || errorLower.includes('missing')) {
    return {
      category: 'system',
      action: 'refresh',
      recoverable: true,
    };
  }

  if (
    errorLower.includes('invalid') ||
    errorLower.includes('required') ||
    errorLower.includes('cannot exceed')
  ) {
    return {
      category: 'validation',
      action: 'correct',
      recoverable: true,
    };
  }

  if (
    errorLower.includes('insufficient') ||
    errorLower.includes('business rule')
  ) {
    return {
      category: 'business',
      action: 'correct',
      recoverable: true,
    };
  }

  if (
    errorLower.includes('network') ||
    errorLower.includes('timeout') ||
    errorLower.includes('connection')
  ) {
    return {
      category: 'network',
      action: 'retry',
      recoverable: true,
    };
  }

  // Default to system error
  return {
    category: 'system',
    action: 'contact_support',
    recoverable: false,
  };
}

/**
 * Generate recovery suggestions based on error type
 */
export function getRecoverySuggestions(error: string): string[] {
  const category = categorizeError(error);
  const errorLower = error.toLowerCase();
  const suggestions: string[] = [];

  switch (category.category) {
    case 'validation':
      suggestions.push('Please check all required fields are filled correctly');
      suggestions.push('Ensure inventory counts are not negative');
      suggestions.push(
        'Verify that reserved and sold counts do not exceed inventory'
      );
      break;

    case 'conflict':
      if (errorLower.includes('variant combination')) {
        suggestions.push('Try a different color, size, or form combination');
        suggestions.push(
          'Check existing variants to see what combinations are already used'
        );
      }
      if (errorLower.includes('sku')) {
        suggestions.push(
          'Use a different SKU or let the system generate one automatically'
        );
      }
      break;

    case 'system':
      suggestions.push('Refresh the page and try again');
      suggestions.push('Check if the product still exists');
      break;

    case 'business':
      suggestions.push('Review the business rules for variant creation');
      suggestions.push('Check inventory levels and adjust as needed');
      break;

    case 'network':
      suggestions.push('Check your internet connection');
      suggestions.push('Try again in a few moments');
      break;

    default:
      suggestions.push('Try refreshing the page');
      suggestions.push('If the problem persists, contact support');
  }

  return suggestions;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return '';
  }

  if (errors.length === 1) {
    return errors[0].message;
  }

  return `${errors.length} issues found:\n${errors.map((e) => `• ${e.message}`).join('\n')}`;
}

/**
 * Enhanced inventory validation
 */
export function validateInventoryOperation(
  variant: ProductVariant,
  operation: 'add' | 'remove' | 'set' | 'reserve' | 'unreserve' | 'sell',
  quantity: number
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (quantity < 0) {
    errors.push({
      message: 'Quantity cannot be negative',
      code: 'NEGATIVE_QUANTITY',
      severity: 'error',
    });
    return { isValid: false, errors, warnings };
  }

  const availableCount =
    variant.inventoryCount - variant.reservedCount - variant.soldCount;

  switch (operation) {
    case 'remove':
      if (quantity > variant.inventoryCount) {
        errors.push({
          message: `Cannot remove ${quantity} items. Only ${variant.inventoryCount} in inventory.`,
          code: 'INSUFFICIENT_INVENTORY',
          severity: 'error',
        });
      }
      break;

    case 'reserve':
      if (quantity > availableCount) {
        errors.push({
          message: `Cannot reserve ${quantity} items. Only ${availableCount} available.`,
          code: 'INSUFFICIENT_AVAILABLE',
          severity: 'error',
        });
      }
      break;

    case 'sell':
      if (quantity > variant.reservedCount) {
        warnings.push({
          message: `Selling ${quantity} items but only ${variant.reservedCount} are reserved. This will reduce available inventory.`,
          code: 'SELLING_UNRESERVED',
          severity: 'warning',
        });
      }
      break;

    case 'unreserve':
      if (quantity > variant.reservedCount) {
        errors.push({
          message: `Cannot unreserve ${quantity} items. Only ${variant.reservedCount} reserved.`,
          code: 'INSUFFICIENT_RESERVED',
          severity: 'error',
        });
      }
      break;

    case 'set':
      if (quantity < variant.reservedCount + variant.soldCount) {
        errors.push({
          message: `Cannot set inventory to ${quantity}. Total allocated is ${variant.reservedCount + variant.soldCount}.`,
          code: 'INVALID_TOTAL',
          severity: 'error',
        });
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
