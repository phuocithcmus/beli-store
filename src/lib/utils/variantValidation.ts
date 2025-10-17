import type { ProductVariant } from '@/types';

/**
 * Variant Uniqueness Validation Utility
 * Ensures product variants have unique combinations of attributes
 */

export interface VariantCombination {
  productId: string;
  size: 'S' | 'M' | 'L' | 'XL';
  form: 'oversized' | 'fit';
  color: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  conflictingVariant?: ProductVariant;
}

/**
 * Check if a variant combination is unique within a product
 */
export function validateVariantUniqueness(
  newVariant: VariantCombination,
  existingVariants: ProductVariant[]
): ValidationResult {
  // Filter variants for the same product
  const productVariants = existingVariants.filter(
    (variant) => variant.productId === newVariant.productId
  );

  // Check for exact combination match
  const conflictingVariant = productVariants.find(
    (variant) =>
      variant.size === newVariant.size &&
      variant.form === newVariant.form &&
      variant.color.toLowerCase() === newVariant.color.toLowerCase()
  );

  if (conflictingVariant) {
    return {
      isValid: false,
      error: `Variant combination already exists: ${newVariant.size}-${newVariant.form}-${newVariant.color}`,
      conflictingVariant,
    };
  }

  return { isValid: true };
}

/**
 * Validate variant uniqueness for updates (excluding the variant being updated)
 */
export function validateVariantUniquenessForUpdate(
  variantId: string,
  updatedVariant: VariantCombination,
  existingVariants: ProductVariant[]
): ValidationResult {
  // Exclude the variant being updated from the check
  const otherVariants = existingVariants.filter(
    (variant) => variant.id !== variantId
  );

  return validateVariantUniqueness(updatedVariant, otherVariants);
}

/**
 * Check if SKU is unique across all variants
 */
export function validateSKUUniqueness(
  sku: string,
  existingVariants: ProductVariant[],
  excludeVariantId?: string
): ValidationResult {
  const variants = excludeVariantId
    ? existingVariants.filter((v) => v.id !== excludeVariantId)
    : existingVariants;

  const conflictingVariant = variants.find((variant) => variant.sku === sku);

  if (conflictingVariant) {
    return {
      isValid: false,
      error: `SKU already exists: ${sku}`,
      conflictingVariant,
    };
  }

  return { isValid: true };
}

/**
 * Validate multiple variants for batch operations
 */
export function validateVariantBatch(
  variants: VariantCombination[],
  existingVariants: ProductVariant[]
): {
  isValid: boolean;
  errors: { index: number; variant: VariantCombination; error: string }[];
} {
  const errors: {
    index: number;
    variant: VariantCombination;
    error: string;
  }[] = [];
  const processedCombinations = new Set<string>();

  variants.forEach((variant, index) => {
    // Check against existing variants
    const uniquenessResult = validateVariantUniqueness(
      variant,
      existingVariants
    );
    if (!uniquenessResult.isValid) {
      errors.push({
        index,
        variant,
        error: uniquenessResult.error || 'Unknown validation error',
      });
      return;
    }

    // Check for duplicates within the batch
    const combinationKey = `${variant.productId}-${variant.size}-${variant.form}-${variant.color.toLowerCase()}`;
    if (processedCombinations.has(combinationKey)) {
      errors.push({
        index,
        variant,
        error: `Duplicate variant in batch: ${variant.size}-${variant.form}-${variant.color}`,
      });
      return;
    }

    processedCombinations.add(combinationKey);
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get available combinations for a product (combinations not yet created)
 */
export function getAvailableCombinations(
  productId: string,
  existingVariants: ProductVariant[]
): VariantCombination[] {
  const sizes: ('S' | 'M' | 'L' | 'XL')[] = ['S', 'M', 'L', 'XL'];
  const forms: ('oversized' | 'fit')[] = ['oversized', 'fit'];

  // Get existing combinations for this product
  const productVariants = existingVariants.filter(
    (v) => v.productId === productId
  );
  const existingCombinations = new Set(
    productVariants.map((v) => `${v.size}-${v.form}-${v.color.toLowerCase()}`)
  );

  // Common colors that could be suggested
  const commonColors = [
    'Black',
    'White',
    'Red',
    'Blue',
    'Green',
    'Yellow',
    'Orange',
    'Purple',
    'Pink',
    'Brown',
    'Gray',
    'Navy',
    'Beige',
  ];

  const availableCombinations: VariantCombination[] = [];

  // Generate all possible combinations
  sizes.forEach((size) => {
    forms.forEach((form) => {
      commonColors.forEach((color) => {
        const combinationKey = `${size}-${form}-${color.toLowerCase()}`;
        if (!existingCombinations.has(combinationKey)) {
          availableCombinations.push({
            productId,
            size,
            form,
            color,
          });
        }
      });
    });
  });

  return availableCombinations;
}

/**
 * Get variant combination statistics for a product
 */
export function getVariantCombinationStats(
  productId: string,
  existingVariants: ProductVariant[]
): {
  totalPossibleCombinations: number;
  createdCombinations: number;
  availableCombinations: number;
  completionPercentage: number;
  missingCombinations: VariantCombination[];
} {
  const sizes = ['S', 'M', 'L', 'XL'];
  const forms = ['oversized', 'fit'];
  const commonColors = ['Black', 'White', 'Red', 'Blue', 'Green'];

  const totalPossibleCombinations =
    sizes.length * forms.length * commonColors.length;
  const productVariants = existingVariants.filter(
    (v) => v.productId === productId
  );
  const createdCombinations = productVariants.length;
  const availableCombinations = getAvailableCombinations(
    productId,
    existingVariants
  );
  const completionPercentage =
    (createdCombinations / totalPossibleCombinations) * 100;

  return {
    totalPossibleCombinations,
    createdCombinations,
    availableCombinations: availableCombinations.length,
    completionPercentage: Math.round(completionPercentage * 100) / 100,
    missingCombinations: availableCombinations.slice(0, 10), // Return first 10 suggestions
  };
}

/**
 * Suggest next variants to create for a product
 */
export function suggestNextVariants(
  productId: string,
  existingVariants: ProductVariant[],
  maxSuggestions: number = 5
): VariantCombination[] {
  const availableCombinations = getAvailableCombinations(
    productId,
    existingVariants
  );

  // Prioritize basic colors and common sizes
  const priorityOrder = {
    sizes: ['M', 'L', 'S', 'XL'],
    colors: ['Black', 'White', 'Navy', 'Gray', 'Red'],
  };

  const sortedCombinations = availableCombinations.sort((a, b) => {
    const aSizeIndex = priorityOrder.sizes.indexOf(a.size);
    const bSizeIndex = priorityOrder.sizes.indexOf(b.size);
    const aColorIndex = priorityOrder.colors.indexOf(a.color);
    const bColorIndex = priorityOrder.colors.indexOf(b.color);

    // Priority by size first, then by color
    if (aSizeIndex !== bSizeIndex) {
      return aSizeIndex - bSizeIndex;
    }
    return aColorIndex - bColorIndex;
  });

  return sortedCombinations.slice(0, maxSuggestions);
}

/**
 * Check if a variant combination follows business rules
 */
export function validateBusinessRules(
  variant: VariantCombination & Partial<ProductVariant>
): ValidationResult {
  // Example business rules - customize based on your needs

  // Rule 1: Certain colors might not be available for certain forms
  if (variant.form === 'oversized' && variant.color.toLowerCase() === 'neon') {
    return {
      isValid: false,
      error: 'Neon colors are not available for oversized variants',
    };
  }

  // Rule 2: Minimum inventory requirements
  if (variant.inventoryCount !== undefined && variant.inventoryCount < 0) {
    return {
      isValid: false,
      error: 'Inventory count cannot be negative',
    };
  }

  // Rule 3: Reserved count cannot exceed inventory count
  if (
    variant.inventoryCount !== undefined &&
    variant.reservedCount !== undefined &&
    variant.reservedCount > variant.inventoryCount
  ) {
    return {
      isValid: false,
      error: 'Reserved count cannot exceed inventory count',
    };
  }

  return { isValid: true };
}
