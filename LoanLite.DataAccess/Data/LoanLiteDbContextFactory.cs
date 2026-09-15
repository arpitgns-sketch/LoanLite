using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace LoanLite.DataAccess.Data;

/// <summary>
/// Design-time factory used by the EF Core tools (dotnet ef migrations / update).
/// This lets you run migrations even if the DataAccess project isn't the startup
/// project, without needing the full API host. Update the connection string to
/// match your local PostgreSQL setup (or keep it in sync with appsettings.json).
/// </summary>
public class LoanLiteDbContextFactory : IDesignTimeDbContextFactory<LoanLiteDbContext>
{
    public LoanLiteDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            "Host=localhost;Port=5432;Database=loanlite;Username=postgres;Password=postgres";

        var options = new DbContextOptionsBuilder<LoanLiteDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new LoanLiteDbContext(options);
    }
}
