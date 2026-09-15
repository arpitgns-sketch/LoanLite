using System.Security.Claims;
using LoanLite.Business.Security;
using LoanLite.DataAccess.Enums;

namespace LoanLite.API.Security;

/// <summary>
/// API-side implementation of ICurrentUser. It reads the identity from the validated
/// JWT that the authentication middleware has already parsed into HttpContext.User.
/// Because the Business layer only knows about ICurrentUser, the services never see
/// HttpContext and stay unit-testable.
/// </summary>
public class CurrentUser : ICurrentUser
{
    private readonly ClaimsPrincipal? _user;

    public CurrentUser(IHttpContextAccessor accessor)
        => _user = accessor.HttpContext?.User;

    public bool IsAuthenticated => _user?.Identity?.IsAuthenticated ?? false;

    public long UserId
    {
        get
        {
            var raw = _user?.FindFirstValue(ClaimTypes.NameIdentifier)
                   ?? _user?.FindFirstValue("sub");
            return long.TryParse(raw, out var id) ? id : 0;
        }
    }

    public UserRole Role
    {
        get
        {
            var raw = _user?.FindFirstValue(ClaimTypes.Role)
                   ?? _user?.FindFirstValue("role");
            return Enum.TryParse<UserRole>(raw, ignoreCase: true, out var r) ? r : default;
        }
    }

    public string? Email => _user?.FindFirstValue(ClaimTypes.Email)
                         ?? _user?.FindFirstValue("email");
}
