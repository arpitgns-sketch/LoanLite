using LoanLite.API.Security;
using LoanLite.Business.Security;
using LoanLite.Business.Services;

namespace LoanLite.API;

/// <summary>
/// Registers application workflow, current-user, and administration services.
/// </summary>
public static class Phase4ServiceRegistration
{
    public static IServiceCollection AddPhase4Workflow(
        this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddScoped<IApplicationService, ApplicationService>();
        services.AddScoped<IAdminService, AdminService>();

        return services;
    }
}
