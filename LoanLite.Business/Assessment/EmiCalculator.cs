namespace LoanLite.Business.Assessment;

/// <summary>
/// Computes the Equated Monthly Instalment using the standard reducing-balance formula
/// from the Business Rules Document (§4):
///
///     EMI = [ P × r × (1 + r)^n ] ÷ [ (1 + r)^n − 1 ]
///
/// where  P = principal (loan amount),  r = monthly rate (annual ÷ 12 ÷ 100),
///        n = tenure in months.
///
/// Pure and static — no DB, no state — so it is trivial to unit-test with xUnit.
/// Verified against the document's worked example: P=₹5,00,000, 14% p.a., n=36 → ₹17,088.81.
/// </summary>
public static class EmiCalculator
{
    /// <summary>
    /// Returns the monthly EMI rounded to 2 decimals. Guards against a zero rate
    /// (falls back to simple P ÷ n) and invalid tenure.
    /// </summary>
    public static decimal Compute(decimal principal, decimal annualRatePercent, int tenureMonths)
    {
        if (tenureMonths <= 0)
            throw new ArgumentOutOfRangeException(nameof(tenureMonths), "Tenure must be positive.");

        // Monthly rate as a fraction, e.g. 14% -> 0.14/12 = 0.0116667
        double r = (double)annualRatePercent / 12d / 100d;

        double emi;
        if (r == 0d)
        {
            emi = (double)principal / tenureMonths;         // guard: zero-interest fallback
        }
        else
        {
            double pow = Math.Pow(1 + r, tenureMonths);     // (1 + r)^n
            emi = (double)principal * r * pow / (pow - 1);
        }

        return Math.Round((decimal)emi, 2, MidpointRounding.AwayFromZero);
    }
}
