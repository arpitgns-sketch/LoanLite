namespace LoanLite.Business.DTOs;

/// <summary>
/// Aggregate user, application, and audit metrics displayed on the
/// Admin Dashboard.
/// </summary>
public class AdminDashboardResponse
{
    // User counts
    public int TotalUsers { get; set; }
    public int Applicants { get; set; }
    public int Processors { get; set; }
    public int Underwriters { get; set; }
    public int Admins { get; set; }

    // Application counts
    public int TotalApplications { get; set; }
    public int Draft { get; set; }
    public int Submitted { get; set; }
    public int InReview { get; set; }
    public int WaitingForDocuments { get; set; }
    public int Referred { get; set; }
    public int Decided { get; set; }
    public int Withdrawn { get; set; }

    // Audit count
    public int TotalAuditRecords { get; set; }
}