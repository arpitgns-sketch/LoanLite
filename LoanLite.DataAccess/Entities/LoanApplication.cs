using LoanLite.DataAccess.Enums;

namespace LoanLite.DataAccess.Entities;

/// <summary>
/// The central business entity — one personal-loan application and its full state.
/// </summary>
public class LoanApplication
{
    public long Id { get; set; }

    /// <summary>Human-friendly unique reference, e.g. "LL-2026-000123".</summary>
    public string ApplicationNumber { get; set; } = null!;

    public ApplicationStatus Status { get; set; } = ApplicationStatus.Draft;

    // ---- Loan details ----
    public decimal LoanAmount { get; set; }
    public int TenureMonths { get; set; }
    public decimal InterestRate { get; set; }

    /// <summary>Computed at assessment time and then frozen. Null until calculated.</summary>
    public decimal? Emi { get; set; }

    // ---- Employment snapshot (added in v1.1) ----
    public string? CompanyName { get; set; }
    public DateOnly? LastSalaryDate { get; set; }

    // ---- Income & credit ----
    /// <summary>Typed by the Applicant.</summary>
    public decimal DeclaredIncome { get; set; }

    /// <summary>Returned by the income-verification service. Null until the check runs.</summary>
    public decimal? VerifiedIncome { get; set; }

    /// <summary>Returned by the credit-score service (300–900). Null until the check runs.</summary>
    public int? CreditScore { get; set; }

    // ---- System recommendation (never final) ----
    public Recommendation? Recommendation { get; set; }
    public string? RecommendationReason { get; set; }

    // ---- Final human decision (Underwriter only) ----
    public Decision? Decision { get; set; }
    public string? DecisionComments { get; set; }

    // ---- Timestamps ----
    public DateTime? SubmittedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // ---- Foreign keys ----
    /// <summary>Owner of the application (required).</summary>
    public long ApplicantId { get; set; }

    /// <summary>Processor who picked it up (set on In Review).</summary>
    public long? ProcessorId { get; set; }

    /// <summary>Underwriter who decided (set on Decided).</summary>
    public long? UnderwriterId { get; set; }

    // ---- Navigation properties ----
    public User Applicant { get; set; } = null!;
    public User? Processor { get; set; }
    public User? Underwriter { get; set; }

    public ICollection<Document> Documents { get; set; } = new List<Document>();
    public ICollection<ApplicationHistory> History { get; set; } = new List<ApplicationHistory>();
}
