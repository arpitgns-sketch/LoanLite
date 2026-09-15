// Reducing-balance EMI, matching the backend rule engine.
// EMI = P * r * (1+r)^n / ((1+r)^n - 1),  r = annualRate/12/100, n = months.
export function calculateEmi(
  principal: number,
  annualRatePercent: number,
  months: number
): number {
  if (!principal || !months) return 0;
  const r = annualRatePercent / 12 / 100;
  if (r === 0) return principal / months;
  const pow = Math.pow(1 + r, months);
  return (principal * r * pow) / (pow - 1);
}

// LoanLite fixed annual interest rate (14% p.a.).
export const ANNUAL_RATE = 14;

export function formatInr(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}
