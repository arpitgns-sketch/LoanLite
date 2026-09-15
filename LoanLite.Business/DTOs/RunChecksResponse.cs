using LoanLite.DataAccess.Enums;

namespace LoanLite.Business.DTOs;

/// <summary>
/// The result of POST /run-checks — the stored assessment figures plus the resulting
/// recommendation and the (possibly changed) application status. This is what the
/// Processor's "Run Checks" screen and the Underwriter's Recommendation Panel display.
/// </summary>
public class RunChecksResponse
{
    public long Id { get; set; }
    public string ApplicationNumber { get; set; } = null!;
    public ApplicationStatus Status { get; set; }

    // Inputs used
    public decimal LoanAmount { get; set; }
    public int TenureMonths { get; set; }
    public decimal AnnualInterestRatePercent { get; set; }
    public decimal DeclaredIncome { get; set; }

    // Check outputs
    public int? CreditScore { get; set; }
    public decimal? VerifiedIncome { get; set; }
    public decimal IncomeMatchPercent { get; set; }

    // Affordability
    public decimal Emi { get; set; }
    public decimal Foir { get; set; }

    // The system's call (never final)
    public Recommendation? Recommendation { get; set; }
    public string? RecommendationReason { get; set; }
}
