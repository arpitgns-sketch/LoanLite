using LoanLite.DataAccess.Enums;

namespace LoanLite.DataAccess.Entities;

/// <summary>
/// A person who can log in. One row per Applicant / Processor / Underwriter / Admin.
/// </summary>
public class User
{
    public long Id { get; set; }

    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;

    /// <summary>Unique login identifier.</summary>
    public string Email { get; set; } = null!;

    public string Phone { get; set; } = null!;

    /// <summary>Never store plain-text passwords — hash only.</summary>
    public string PasswordHash { get; set; } = null!;

    public UserRole Role { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ---- Navigation properties ----

    /// <summary>Applications where this user is the Applicant.</summary>
    public ICollection<LoanApplication> Applications { get; set; } = new List<LoanApplication>();

    /// <summary>History rows created by this user (the "actor").</summary>
    public ICollection<ApplicationHistory> HistoryEntries { get; set; } = new List<ApplicationHistory>();
}
