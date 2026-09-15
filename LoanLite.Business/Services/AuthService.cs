using LoanLite.Business.DTOs;
using LoanLite.Business.Security;
using LoanLite.DataAccess.Data;
using LoanLite.DataAccess.Entities;
using LoanLite.DataAccess.Enums;
using Microsoft.EntityFrameworkCore;

namespace LoanLite.Business.Services;

/// <summary>
/// Handles account creation and login. Passwords are hashed (never stored plain),
/// and a signed JWT is returned so the client can authenticate subsequent calls.
/// </summary>
public class AuthService : IAuthService
{
    private readonly LoanLiteDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public AuthService(
        LoanLiteDbContext db,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator tokenGenerator)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, bool allowStaffRoles = false)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        // Enforce unique email (also protected by a DB unique index).
        var exists = await _db.Users.AnyAsync(u => u.Email == email);
        if (exists)
            throw new InvalidOperationException("An account with this email already exists.");

        // Security guard: public registration may only create Applicants.
        var role = allowStaffRoles ? request.Role : UserRole.Applicant;

        var user = new User
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = email,
            Phone = request.Phone.Trim(),
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = role
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return BuildResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

        // Same generic message whether email or password is wrong (avoids user enumeration).
        if (user is null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        return BuildResponse(user);
    }

    private AuthResponse BuildResponse(User user)
    {
        var (token, expiresAtUtc) = _tokenGenerator.Generate(user);

        return new AuthResponse
        {
            UserId = user.Id,
            FullName = $"{user.FirstName} {user.LastName}",
            Email = user.Email,
            Role = user.Role,
            Token = token,
            ExpiresAtUtc = expiresAtUtc
        };
    }
}
