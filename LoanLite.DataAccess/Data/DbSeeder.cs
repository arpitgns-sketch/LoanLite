using LoanLite.DataAccess.Entities;
using LoanLite.DataAccess.Enums;
using Microsoft.EntityFrameworkCore;

namespace LoanLite.DataAccess.Data;

/// <summary>
/// Seeds a default Admin user on startup if none exists, so you can bootstrap
/// the system (the Admin then creates Processors/Underwriters via /api/auth/staff).
///
/// NOTE: the password hash is passed in from the API layer, because hashing lives
/// in the Business project. Change the default credentials before any real use.
/// </summary>
public static class DbSeeder
{
    public const string DefaultAdminEmail = "admin@loanlite.local";

    /// <param name="passwordHash">A pre-computed BCrypt hash for the admin password.</param>
    public static async Task SeedAdminAsync(LoanLiteDbContext db, string passwordHash)
    {
        var adminExists = await db.Users.AnyAsync(u => u.Role == UserRole.Admin);
        if (adminExists) return;

        db.Users.Add(new User
        {
            FirstName = "System",
            LastName = "Admin",
            Email = DefaultAdminEmail,
            Phone = "0000000000",
            PasswordHash = passwordHash,
            Role = UserRole.Admin
        });

        await db.SaveChangesAsync();
    }
}
