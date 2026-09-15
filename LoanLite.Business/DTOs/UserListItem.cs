using LoanLite.DataAccess.Enums;

namespace LoanLite.Business.DTOs;

/// <summary>One user row returned to the Admin User Management screen.</summary>
public class UserListItem
{
    public long Id { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public UserRole Role { get; set; }
    public DateTime CreatedAt { get; set; }
}
