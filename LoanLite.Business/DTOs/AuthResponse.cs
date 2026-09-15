using LoanLite.DataAccess.Enums;

namespace LoanLite.Business.DTOs;

/// <summary>
/// Returned on successful register/login. The Angular app stores the token
/// and sends it as "Authorization: Bearer {token}" on every request.
/// </summary>
public class AuthResponse
{
    public long UserId { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public UserRole Role { get; set; }

    /// <summary>The signed JWT.</summary>
    public string Token { get; set; } = null!;

    /// <summary>UTC expiry so the client knows when to re-login.</summary>
    public DateTime ExpiresAtUtc { get; set; }
}
