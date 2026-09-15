using LoanLite.DataAccess.Enums;

namespace LoanLite.Business.Security;

/// <summary>
/// Abstraction over "who is calling right now". The Business layer depends only on this
/// interface — it never sees HttpContext. The API layer provides the implementation by
/// reading the validated JWT claims. This keeps the service layer testable (you can mock
/// ICurrentUser in xUnit) and free of web concerns.
/// </summary>
public interface ICurrentUser
{
    /// <summary>The signed-in user's database id (from the JWT "sub"/NameIdentifier claim).</summary>
    long UserId { get; }

    /// <summary>The signed-in user's role (from the JWT role claim).</summary>
    UserRole Role { get; }

    /// <summary>Convenience email, if present on the token.</summary>
    string? Email { get; }

    /// <summary>True when a token was actually present and parsed.</summary>
    bool IsAuthenticated { get; }
}
