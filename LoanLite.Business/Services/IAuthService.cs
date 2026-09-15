using LoanLite.Business.DTOs;

namespace LoanLite.Business.Services;

/// <summary>Authentication operations: register and login.</summary>
public interface IAuthService
{
    /// <summary>
    /// Registers a new user. <paramref name="allowStaffRoles"/> is true only when an Admin
    /// is creating staff; public registration must pass false (forces Applicant role).
    /// </summary>
    Task<AuthResponse> RegisterAsync(RegisterRequest request, bool allowStaffRoles = false);

    /// <summary>Validates credentials and returns a JWT on success.</summary>
    Task<AuthResponse> LoginAsync(LoginRequest request);
}
