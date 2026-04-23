/** Format a number as fiat currency using Intl.NumberFormat */
export const formatFiatAmount = (
  value: number,
  currency = 'USD',
  locale?: string,
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}
