using LoanLite.DataAccess.Enums;

namespace LoanLite.Business.DTOs;

/// <summary>
/// One entry in the Admin audit log.
/// Data is projected from ApplicationHistory together with its application and actor.
/// </summary>
public class AuditLogItem
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
