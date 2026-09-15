namespace LoanLite.Business.Security;

/// <summary>
/// Strongly-typed JWT configuration, bound from the "Jwt" section of appsettings.json.
/// </summary>
public class JwtSettings
{
    public const string SectionName = "Jwt";

    /// <summary>Secret signing key. MUST be long/random and kept out of source control in real apps.</summary>
    public string Key { get; set; } = null!;

    /// <summary>Who issued the token (your API).</summary>
    public string Issuer { get; set; } = null!;

    /// <summary>Who the token is for (your Angular app).</summary>
    public string Audience { get; set; } = null!;

    /// <summary>How long the token stays valid.</summary>
    public int ExpiryMinutes { get; set; } = 120;
}
