using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LoanLite.DataAccess.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace LoanLite.Business.Security;

/// <summary>
/// Builds a signed JWT containing the user's id, email, and role.
/// The role claim is what powers [Authorize(Roles = "...")] on controllers.
/// </summary>
public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly JwtSettings _settings;

    public JwtTokenGenerator(IOptions<JwtSettings> settings)
    {
        _settings = settings.Value;
    }

    public (string token, DateTime expiresAtUtc) Generate(User user)
    {
        var expiresAtUtc = DateTime.UtcNow.AddMinutes(_settings.ExpiryMinutes);

        // Claims = the pieces of identity stored inside the token.
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new Claim(ClaimTypes.Role, user.Role.ToString()), // drives role-based authorization
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: expiresAtUtc,
            signingCredentials: credentials);

        var jwt = new JwtSecurityTokenHandler().WriteToken(token);
        return (jwt, expiresAtUtc);
    }
}
