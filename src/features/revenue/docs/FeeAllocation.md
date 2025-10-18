# Import Phase Fee Allocation in Profit Calculation

## Overview

The profit calculation system now includes proportional allocation of import phase fees (shipping, customs, handling, etc.) to individual products when calculating revenue entry profits.

## How Fee Allocation Works

### 1. Fee Types Supported
- **Shipping**: Transportation costs
- **Customs**: Import duties and taxes
- **Handling**: Processing and handling fees
- **Storage**: Warehousing costs
- **Other**: Miscellaneous fees

### 2. Proportional Allocation Method

Import phase fees are distributed among products based on their **value contribution** to the total import phase value:

```
Product Value = Product Quantity × Product Unit Cost
Total Phase Value = Sum of all products' values in the phase
Allocation Ratio = Product Value ÷ Total Phase Value
Allocated Fee = Total Fee × Allocation Ratio
Fee Per Unit = Allocated Fee ÷ Product Quantity
```

### 3. Example Calculation

**Import Phase with:**
- Product A: 100 units @ $10 each = $1,000 value
- Product B: 50 units @ $20 each = $1,000 value
- Total Phase Value: $2,000
- Shipping Fee: $200

**Fee Allocation:**
- Product A: ($1,000 ÷ $2,000) × $200 = $100 shipping fee
- Product B: ($1,000 ÷ $2,000) × $200 = $100 shipping fee

**Per Unit Cost:**
- Product A: $10 base cost + ($100 ÷ 100 units) = $11.00 total cost per unit
- Product B: $20 base cost + ($100 ÷ 50 units) = $22.00 total cost per unit

## Implementation Details

### New Storage Methods

1. **`getImportPhaseProductFullCost(importPhaseId, productId)`**
   - Returns the total unit cost including allocated fees
   - Used by profit calculation system

2. **`getImportPhaseProductCostBreakdown(importPhaseId, productId)`**
   - Returns detailed breakdown with base cost, allocated fees, and fee breakdown
   - Used by ProfitDisplay component for detailed view

### Updated Components

1. **ProfitDisplay Component**
   - Shows fee breakdown in detailed view
   - Displays "Base Cost + Import Fees" separately
   - No longer requires manual unitCost prop

2. **Revenue Entry Creation**
   - Automatically uses full cost calculation
   - More accurate profit calculations

## Benefits

1. **More Accurate Profit Calculation**: Includes all costs associated with importing products
2. **Transparent Cost Breakdown**: Users can see exactly how fees affect profit margins
3. **Fair Fee Distribution**: Fees allocated proportionally based on product value
4. **Automatic Calculation**: No manual input required - fees automatically included

## Usage Examples

### Viewing Detailed Cost Breakdown
When viewing a revenue entry with an import phase, the ProfitDisplay component now shows:
- Base product cost
- Individual fee allocations (shipping, customs, etc.)
- Total unit cost
- Net profit calculation

### Revenue Analytics
All revenue analytics now use the complete cost calculation including fees, providing more accurate profit margins and ROI calculations.