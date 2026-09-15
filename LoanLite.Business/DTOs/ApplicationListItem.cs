using LoanLite.DataAccess.Enums;

namespace LoanLite.Business.DTOs;

/// <summary>
/// Lightweight row for lists and work-list queues — just enough to render a table
/// without shipping the whole application object.
/// </summary>
public class ApplicationListItem
{
    public long Id { get; set; }
    public string ApplicationNumber { get; set; } = null!;
    public ApplicationStatus Status { get; set; }
    public decimal LoanAmount { get; set; }
    public int? TenureMonths { get; set; }

    public string? ApplicantName { get; set; }
    public Recommendation? Recommendation { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
}
