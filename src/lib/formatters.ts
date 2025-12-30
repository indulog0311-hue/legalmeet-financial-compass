/**
 * Formatters for Colombian financial display
 * - Valores monetarios: formato millar sin decimales (ej: $ 1.500.000)
 * - Cantidades de servicios: valores absolutos enteros (ej: 1.234)
 */

/**
 * Format number as Colombian currency (thousands format, no decimals)
 * Example: 1500000 -> "$ 1.500.000"
 */
export function formatCOP(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

/**
 * Format number with Colombian thousands separator (for monetary values without currency symbol)
 * Example: 1500000 -> "1.500.000"
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

/**
 * Format service/transaction counts as absolute integers
 * Example: 1234.56 -> "1.234"
 */
export function formatServicios(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.floor(value));
}

/**
 * Format as percentage (with configurable decimals)
 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format months/runway
 */
export function formatMonths(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  if (value >= 999) return '∞';
  return `${value.toFixed(1)} meses`;
}

/**
 * Get color class based on value comparison
 */
export function getValueColor(value: number, benchmark: number, higherIsBetter = true): string {
  if (higherIsBetter) {
    return value >= benchmark ? 'text-success' : 'text-destructive';
  }
  return value <= benchmark ? 'text-success' : 'text-destructive';
}

/**
 * Format compact number (K, M, B) - no decimals for thousands
 */
export function formatCompact(value: number): string {
  if (value >= 1e9) return `${Math.round(value / 1e9)}B`;
  if (value >= 1e6) return `${Math.round(value / 1e6)}M`;
  if (value >= 1e3) return `${Math.round(value / 1e3)}K`;
  return Math.round(value).toString();
}
