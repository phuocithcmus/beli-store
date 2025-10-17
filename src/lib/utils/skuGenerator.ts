/**
 * SKU Generation Utility
 * Generates unique SKU codes for product variants
 */

export interface SKUGenerationOptions {
  productCode: string;
  size: 'S' | 'M' | 'L' | 'XL';
  form: 'oversized' | 'fit';
  color: string;
  suffix?: string;
}

/**
 * Size code mapping for SKU generation
 */
const SIZE_CODES = {
  S: 'S',
  M: 'M',
  L: 'L',
  XL: 'XL',
} as const;

/**
 * Form code mapping for SKU generation
 */
const FORM_CODES = {
  oversized: 'OS',
  fit: 'FT',
} as const;

/**
 * Generate a standardized SKU for a product variant
 * Format: {PRODUCT_CODE}-{SIZE}-{FORM}-{COLOR_CODE}[-{SUFFIX}]
 * Example: SHIRT001-M-FT-BLU or PANTS002-L-OS-RED-V2
 */
export function generateSKU(options: SKUGenerationOptions): string {
  const { productCode, size, form, color, suffix } = options;

  // Validate inputs
  if (!productCode || productCode.trim() === '') {
    throw new Error('Product code is required for SKU generation');
  }

  if (!color || color.trim() === '') {
    throw new Error('Color is required for SKU generation');
  }

  // Normalize and truncate components
  const normalizedProductCode = productCode.toUpperCase().trim();
  const sizeCode = SIZE_CODES[size];
  const formCode = FORM_CODES[form];
  const colorCode = normalizeColorCode(color);

  // Build SKU components
  const skuParts = [normalizedProductCode, sizeCode, formCode, colorCode];

  // Add suffix if provided
  if (suffix && suffix.trim() !== '') {
    skuParts.push(suffix.toUpperCase().trim());
  }

  return skuParts.join('-');
}

/**
 * Normalize color name to a 3-character code
 */
function normalizeColorCode(color: string): string {
  const normalized = color.toLowerCase().trim();

  // Common color mappings
  const colorMappings: Record<string, string> = {
    // Basic colors
    black: 'BLK',
    white: 'WHT',
    red: 'RED',
    blue: 'BLU',
    green: 'GRN',
    yellow: 'YEL',
    orange: 'ORG',
    purple: 'PUR',
    pink: 'PNK',
    brown: 'BRN',
    gray: 'GRY',
    grey: 'GRY',

    // Extended colors
    navy: 'NVY',
    beige: 'BGE',
    khaki: 'KHK',
    cream: 'CRM',
    maroon: 'MAR',
    teal: 'TEL',
    coral: 'COR',
    mint: 'MNT',
    gold: 'GLD',
    silver: 'SLV',

    // Multi-word colors
    'light blue': 'LBL',
    'dark blue': 'DBL',
    'light green': 'LGR',
    'dark green': 'DGR',
    'light gray': 'LGY',
    'dark gray': 'DGY',
  };

  // Return mapped color if exists
  if (colorMappings[normalized]) {
    return colorMappings[normalized];
  }

  // For unknown colors, generate a 3-character code from the first 3 characters
  return (
    normalized
      .replace(/[^a-z]/g, '')
      .substring(0, 3)
      .toUpperCase() || 'UNK'
  );
}

/**
 * Validate SKU format
 */
export function validateSKU(sku: string): { isValid: boolean; error?: string } {
  if (!sku || sku.trim() === '') {
    return { isValid: false, error: 'SKU cannot be empty' };
  }

  const trimmedSKU = sku.trim();

  // Basic format check: at least 4 parts separated by hyphens
  const parts = trimmedSKU.split('-');
  if (parts.length < 4) {
    return {
      isValid: false,
      error: 'SKU must have at least 4 parts: PRODUCT-SIZE-FORM-COLOR',
    };
  }

  // Check each part is not empty
  if (parts.some((part) => part.trim() === '')) {
    return {
      isValid: false,
      error: 'SKU parts cannot be empty',
    };
  }

  // Check size code validity
  const sizeCode = parts[1];
  if (!(Object.values(SIZE_CODES) as string[]).includes(sizeCode)) {
    return {
      isValid: false,
      error: `Invalid size code: ${sizeCode}. Must be one of: ${Object.values(SIZE_CODES).join(', ')}`,
    };
  }

  // Check form code validity
  const formCode = parts[2];
  if (!(Object.values(FORM_CODES) as string[]).includes(formCode)) {
    return {
      isValid: false,
      error: `Invalid form code: ${formCode}. Must be one of: ${Object.values(FORM_CODES).join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Parse SKU into its components
 */
export function parseSKU(sku: string): {
  productCode: string;
  size: 'S' | 'M' | 'L' | 'XL';
  form: 'oversized' | 'fit';
  colorCode: string;
  suffix?: string;
} | null {
  const validation = validateSKU(sku);
  if (!validation.isValid) {
    return null;
  }

  const parts = sku.trim().split('-');
  const [productCode, sizeCode, formCode, colorCode, ...suffixParts] = parts;

  // Map codes back to enum values
  const size = Object.entries(SIZE_CODES).find(
    ([, code]) => code === sizeCode
  )?.[0] as 'S' | 'M' | 'L' | 'XL';
  const form = Object.entries(FORM_CODES).find(
    ([, code]) => code === formCode
  )?.[0] as 'oversized' | 'fit';

  if (!size || !form) {
    return null;
  }

  return {
    productCode,
    size,
    form,
    colorCode,
    suffix: suffixParts.length > 0 ? suffixParts.join('-') : undefined,
  };
}

/**
 * Generate multiple SKUs for a product with different variants
 */
export function generateVariantSKUs(
  productCode: string,
  variants: {
    size: 'S' | 'M' | 'L' | 'XL';
    form: 'oversized' | 'fit';
    color: string;
    suffix?: string;
  }[]
): string[] {
  return variants.map((variant) =>
    generateSKU({
      productCode,
      ...variant,
    })
  );
}

/**
 * Check if SKU is unique in a list of existing SKUs
 */
export function isUniqueSKU(sku: string, existingSKUs: string[]): boolean {
  return !existingSKUs.includes(sku);
}

/**
 * Generate unique SKU with auto-increment suffix if needed
 */
export function generateUniqueSKU(
  options: SKUGenerationOptions,
  existingSKUs: string[]
): string {
  const baseSKU = generateSKU(options);

  if (isUniqueSKU(baseSKU, existingSKUs)) {
    return baseSKU;
  }

  // Try with numeric suffixes
  let counter = 1;
  let uniqueSKU: string;

  do {
    const suffix = options.suffix
      ? `${options.suffix}-${counter}`
      : `V${counter}`;
    uniqueSKU = generateSKU({
      ...options,
      suffix,
    });
    counter++;
  } while (!isUniqueSKU(uniqueSKU, existingSKUs) && counter < 100);

  if (counter >= 100) {
    throw new Error('Unable to generate unique SKU after 100 attempts');
  }

  return uniqueSKU;
}
