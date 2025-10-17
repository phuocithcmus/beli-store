/**
 * Fee calculation utilities
 * Provides standardized fee calculation functions for import and channel fees
 * Implements T007 - Fee calculation utilities
 */

import type { ChannelFeeStructure, ImportFee } from '@/types';

/**
 * Calculate channel fee based on fee structure and revenue amount
 * @param feeStructure - The channel fee structure
 * @param revenueAmount - The gross revenue amount
 * @returns Calculated fee amount in VND
 */
export function calculateChannelFee(
  feeStructure: ChannelFeeStructure,
  revenueAmount: number
): number {
  if (!feeStructure || !feeStructure.isActive || revenueAmount <= 0) {
    return 0;
  }

  // Calculate percentage fee
  const percentageFee = (revenueAmount * feeStructure.percentageRate) / 100;

  // Add fixed fee
  const totalFee = percentageFee + feeStructure.fixedFee;

  // Apply minimum fee if specified
  let finalFee = totalFee;
  if (feeStructure.minimumFee && finalFee < feeStructure.minimumFee) {
    finalFee = feeStructure.minimumFee;
  }

  // Apply maximum fee if specified
  if (feeStructure.maximumFee && finalFee > feeStructure.maximumFee) {
    finalFee = feeStructure.maximumFee;
  }

  // Round to nearest VND (no decimals)
  return Math.round(finalFee);
}

/**
 * Calculate total import fees from a list of fees
 * @param fees - Array of import fees
 * @returns Total fee amount in VND
 */
export function calculateTotalImportFees(fees: ImportFee[]): number {
  if (!fees || fees.length === 0) {
    return 0;
  }

  const total = fees.reduce((sum, fee) => sum + fee.amount, 0);
  return Math.round(total);
}

/**
 * Calculate fee percentage of total amount
 * @param feeAmount - The fee amount
 * @param totalAmount - The total amount
 * @returns Fee percentage (0-100)
 */
export function calculateFeePercentage(
  feeAmount: number,
  totalAmount: number
): number {
  if (totalAmount <= 0) {
    return 0;
  }

  const percentage = (feeAmount / totalAmount) * 100;
  return Math.round(percentage * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate net amount after deducting fees
 * @param grossAmount - The gross amount
 * @param feeAmount - The fee amount to deduct
 * @returns Net amount after fees
 */
export function calculateNetAmount(
  grossAmount: number,
  feeAmount: number
): number {
  const net = grossAmount - feeAmount;
  return net > 0 ? net : 0;
}

/**
 * Validate fee structure configuration
 * @param feeStructure - The fee structure to validate
 * @returns Validation result with any errors
 */
export function validateFeeStructure(
  feeStructure: Partial<ChannelFeeStructure>
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!feeStructure.percentageRate && feeStructure.percentageRate !== 0) {
    errors.push('Percentage rate is required');
  } else if (feeStructure.percentageRate < 0) {
    errors.push('Percentage rate cannot be negative');
  } else if (feeStructure.percentageRate > 100) {
    errors.push('Percentage rate cannot exceed 100%');
  }

  if (!feeStructure.fixedFee && feeStructure.fixedFee !== 0) {
    errors.push('Fixed fee is required');
  } else if (feeStructure.fixedFee < 0) {
    errors.push('Fixed fee cannot be negative');
  }

  if (feeStructure.minimumFee && feeStructure.minimumFee < 0) {
    errors.push('Minimum fee cannot be negative');
  }

  if (feeStructure.maximumFee && feeStructure.maximumFee < 0) {
    errors.push('Maximum fee cannot be negative');
  }

  if (
    feeStructure.minimumFee &&
    feeStructure.maximumFee &&
    feeStructure.minimumFee > feeStructure.maximumFee
  ) {
    errors.push('Minimum fee cannot be greater than maximum fee');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate fee breakdown for display purposes
 * @param feeStructure - The channel fee structure
 * @param revenueAmount - The gross revenue amount
 * @returns Detailed fee breakdown
 */
export function calculateFeeBreakdown(
  feeStructure: ChannelFeeStructure,
  revenueAmount: number
): {
  percentageFee: number;
  fixedFee: number;
  totalBeforeMinMax: number;
  minimumApplied: boolean;
  maximumApplied: boolean;
  finalFee: number;
  netAmount: number;
} {
  const percentageFee = (revenueAmount * feeStructure.percentageRate) / 100;
  const { fixedFee } = feeStructure;
  const totalBeforeMinMax = percentageFee + fixedFee;

  let finalFee = totalBeforeMinMax;
  let minimumApplied = false;
  let maximumApplied = false;

  // Apply minimum fee if specified
  if (feeStructure.minimumFee && finalFee < feeStructure.minimumFee) {
    finalFee = feeStructure.minimumFee;
    minimumApplied = true;
  }

  // Apply maximum fee if specified
  if (feeStructure.maximumFee && finalFee > feeStructure.maximumFee) {
    finalFee = feeStructure.maximumFee;
    maximumApplied = true;
  }

  finalFee = Math.round(finalFee);
  const netAmount = calculateNetAmount(revenueAmount, finalFee);

  return {
    percentageFee: Math.round(percentageFee),
    fixedFee: Math.round(fixedFee),
    totalBeforeMinMax: Math.round(totalBeforeMinMax),
    minimumApplied,
    maximumApplied,
    finalFee,
    netAmount,
  };
}
