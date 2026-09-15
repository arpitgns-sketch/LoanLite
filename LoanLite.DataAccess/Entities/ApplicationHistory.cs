namespace LoanLite.DataAccess.Entities;

/// <summary>
/// Immutable audit trail. Exactly one row is written for every state transition
/// and significant action: who did it, what changed, and when.
/// </summary>
public class ApplicationHistory
{
    public long Id { get; set; }

    /// <summary>Short verb/label, e.g. "Submitted", "PickedUp", "Decided".</summary>
    public string Action { get; set; } = null!;

    /// <summary>Human-readable detail, e.g. "Status In Review -> Referred (FOIR 46%)".</summary>
    public string Details { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ---- Foreign keys ----
    public long ApplicationId { get; set; }

    /// <summary>The user who performed the action (the "actor").</summary>
    public long UserId { get; set; }

    // ---- Navigation ----
    public LoanApplication Application { get; set; } = null!;
    public User User { get; set; } = null!;
}
