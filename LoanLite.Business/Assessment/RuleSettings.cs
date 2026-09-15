namespace LoanLite.Business.Assessment;

/// <summary>
/// The tunable business parameters that drive the recommendation, matching the
/// Decision Thresholds table (§6) in the Business Rules Document. Bound from the
/// "RuleEngine" section of appsettings.json so they can be changed WITHOUT a recompile
/// — just edit the file and restart.
///
/// Defaults below are the document's proposed POC values («confirm» with business).
/// </summary>
public class RuleSettings
{
    /// <summary>Fixed product interest rate, % per annum (Business Rules §2).</summary>
    public decimal AnnualInterestRatePercent { get; set; } = 14.0m;

    /// <summary>T1 — auto-approve credit floor (strong credit).</summary>
    public int MinCreditScoreApprove { get; set; } = 750;

    /// <summary>T2 — auto-reject credit ceiling (weak credit): reject if score &lt; this.</summary>
    public int MinCreditScoreReject { get; set; } = 600;

    /// <summary>T3 — maximum FOIR (EMI ÷ verified income). Above this → reject.</summary>
    public decimal MaxFoir { get; set; } = 0.50m;

    /// <summary>T4 — comfortable FOIR for auto-approve.</summary>
    public decimal ComfortableFoir { get; set; } = 0.40m;

    /// <summary>T5 — minimum income-match % (verified ÷ declared × 100).</summary>
    public decimal MinIncomeMatchPercent { get; set; } = 80m;

    /// <summary>T6 — minimum verified monthly income (₹) for baseline eligibility.</summary>
    public decimal MinVerifiedIncome { get; set; } = 25_000m;
}
