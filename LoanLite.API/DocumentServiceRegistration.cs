using LoanLite.Business.Documents;

namespace LoanLite.API;

public static class DocumentServiceRegistration
{
    public static IServiceCollection AddDocumentManagement(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        services.Configure<DocumentStorageOptions>(options =>
        {
            configuration.GetSection(DocumentStorageOptions.SectionName).Bind(options);

            if (!Path.IsPathRooted(options.RootPath))
                options.RootPath = Path.Combine(environment.ContentRootPath, options.RootPath);
        });

        services.AddScoped<IDocumentService, DocumentService>();
        return services;
    }
}
