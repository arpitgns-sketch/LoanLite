using LoanLite.DataAccess.Enums;

namespace LoanLite.Business.DTOs;

/// <summary>
/// Full detail of one application, returned by GET /api/applications/{id} and by every
/// state-changing endpoint (so the client always gets the fresh state back).
/// </summary>
public class ApplicationResponse
{
    public long Id { get; set; }
    public string ApplicationNumber { get; set; } = null!;
    public ApplicationStatus Status { get; set; }

    // Loan & employment snapshot
    public decimal? LoanAmount { get; set; }
    public int? TenureMonths { get; set; }
    public string? CompanyName { get; set; }
    public DateOnly? LastSalaryDate { get; set; }
    public decimal? DeclaredIncome { get; set; }

    // Assessment outputs (populated in Phase 5)
    public Recommendation? Recommendation { get; set; }
    public string? RecommendationReason { get; set; }
    public Decision? Decision { get; set; }

    // Ownership / routing
    public long ApplicantId { get; set; }
    public string? ApplicantName { get; set; }
    public long? ProcessorId { get; set; }
    public long? UnderwriterId { get; set; }

    // Timestamps
    public DateTime CreatedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
