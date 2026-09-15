using System.Text;
using LoanLite.Business.Security;
using LoanLite.Business.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace LoanLite.API;

/// <summary>
/// Groups the Phase 3 service registrations so Program.cs stays tidy.
/// Call builder.Services.AddLoanLiteAuth(builder.Configuration) from Program.cs.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddLoanLiteAuth(
        this IServiceCollection services, IConfiguration configuration)
    {
        // Bind the "Jwt" config section to JwtSettings.
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        var jwt = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()!;

        // Business services.
        services.AddScoped<IPasswordHasher, BCryptPasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IAuthService, AuthService>();

        // Authentication: validate incoming Bearer tokens.
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwt.Issuer,
                ValidAudience = jwt.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
                ClockSkew = TimeSpan.Zero // no grace period past expiry
            };
        });

        services.AddAuthorization();

        return services;
    }
}
