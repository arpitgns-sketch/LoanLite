using LoanLite.DataAccess.Enums;

namespace LoanLite.Business.DTOs;

/// <summary>
/// One immutable application audit entry returned to the frontend.
/// Includes application and actor information so clients do not need
/// additional requests for every history row.
/// </summary>
public class ApplicationHistoryResponse
{
    public long Id { get; set; }
    public long ApplicationId { get; set; }
    public string ApplicationNumber { get; set; } = null!;
    public string Action { get; set; } = null!;
    public string Details { get; set; } = null!;
    public long PerformedByUserId { get; set; }
    public string PerformedByName { get; set; } = null!;
    public string PerformedByEmail { get; set; } = null!;
    public UserRole PerformedByRole { get; set; }
    public DateTime CreatedAt { get; set; }
}
