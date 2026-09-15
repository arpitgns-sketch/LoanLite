using LoanLite.DataAccess.Entities;

namespace LoanLite.Business.Security;

/// <summary>Creates signed JWTs for authenticated users.</summary>
public interface IJwtTokenGenerator
{
    (string token, DateTime expiresAtUtc) Generate(User user);
}
