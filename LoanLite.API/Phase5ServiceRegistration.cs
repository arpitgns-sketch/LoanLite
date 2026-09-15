using LoanLite.Business.Assessment;
using LoanLite.Business.External;
using LoanLite.Business.Services;

namespace LoanLite.API;

/// <summary>
/// Phase 5 dependency wiring. Call from Program.cs:
///     builder.Services.AddPhase5RuleEngine(builder.Configuration);
/// (Add AFTER AddPhase4Workflow — it reuses ICurrentUser and the DbContext from earlier phases.)
/// </summary>
public static class Phase5ServiceRegistration
{
    public static IServiceCollection AddPhase5RuleEngine(
        this IServiceCollection services, IConfiguration config)
    {
        // Tunable thresholds + stub behaviour, bound from appsettings (no recompile to change).
        services.Configure<RuleSettings>(config.GetSection("RuleEngine"));
        services.Configure<CheckStubSettings>(config.GetSection("CheckStubs"));

        // Provided TEST services — swap these two lines for real clients in production.
        services.AddScoped<ICreditCheckService, StubCreditCheckService>();
        services.AddScoped<IIncomeVerificationService, StubIncomeVerificationService>();

        // The decisioning engine + the orchestrator.
        services.AddScoped<IRuleEngine, RuleEngine>();
        services.AddScoped<IAssessmentService, AssessmentService>();

        return services;
    }
}
