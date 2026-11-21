/**
 * Safe Monetary Calculation Utilities for PATRONET
 * 
 * Uses integer paise arithmetic to completely eliminate IEEE 754 floating-point
 * rounding accumulation errors.
 * 1 INR = 100 paise.
 */

export const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Converts an INR numeric price to integer paise.
 * Handles prices like 999.50, 1299.99 with exact rounding.
 */
export function inrToPaise(rupees: number): number {
  if (typeof rupees !== 'number' || isNaN(rupees)) return 0;
  return Math.round(rupees * 100);
}

/**
 * Converts integer paise back to INR decimal number.
 */
export function paiseToInr(paise: number): number {
  if (typeof paise !== 'number' || isNaN(paise)) return 0;
  return paise / 100;
}

/**
 * Calculates line item total in integer paise.
 */
export function calculateLineTotalPaise(unitPriceInr: number, quantity: number): number {
  const unitPricePaise = inrToPaise(unitPriceInr);
  const safeQty = Math.max(0, Math.floor(quantity || 0));
  return unitPricePaise * safeQty;
}

/**
 * Calculates sum of line totals in integer paise.
 */
export function calculateSubtotalPaise(lines: Array<{ unitPrice: number; quantity: number }>): number {
  return lines.reduce((total, line) => {
    return total + calculateLineTotalPaise(line.unitPrice, line.quantity);
  }, 0);
}

/**
 * Formats an INR price cleanly using en-IN currency rules.
 * If price has no fractional paise (e.g. 94990), displays ₹94,990.
 * If price has fractional paise (e.g. 999.50), displays ₹999.50.
 */
export function formatInr(rupees: number): string {
  if (typeof rupees !== 'number' || isNaN(rupees)) return '₹0';
  // Check if there are fractional paise
  const hasFraction = Math.abs(rupees % 1) > 0.001;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Formats integer paise directly using en-IN currency rules.
 */
export function formatPaise(paise: number): string {
  return formatInr(paiseToInr(paise));
}
