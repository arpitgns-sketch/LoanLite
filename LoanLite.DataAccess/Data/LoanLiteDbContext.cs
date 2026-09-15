using LoanLite.DataAccess.Entities;
using Microsoft.EntityFrameworkCore;

namespace LoanLite.DataAccess.Data;

/// <summary>
/// EF Core DbContext for LoanLite. Maps the 4 entities to snake_case PostgreSQL
/// tables, stores all enums as readable strings, enforces unique keys, and wires
/// up the three User relationships on LoanApplication.
/// </summary>
public class LoanLiteDbContext : DbContext
{
    public LoanLiteDbContext(DbContextOptions<LoanLiteDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<LoanApplication> LoanApplications => Set<LoanApplication>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<ApplicationHistory> ApplicationHistory => Set<ApplicationHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ---------------- User ----------------
        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasKey(u => u.Id);

            e.Property(u => u.FirstName).HasMaxLength(80).IsRequired();
            e.Property(u => u.LastName).HasMaxLength(80).IsRequired();
            e.Property(u => u.Email).HasMaxLength(160).IsRequired();
            e.Property(u => u.Phone).HasMaxLength(20).IsRequired();
            e.Property(u => u.PasswordHash).HasMaxLength(256).IsRequired();

            // Store enum as text (e.g. "Applicant") instead of an int.
            e.Property(u => u.Role).HasConversion<string>().HasMaxLength(20).IsRequired();

            e.HasIndex(u => u.Email).IsUnique();
        });

        // ---------------- LoanApplication ----------------
        modelBuilder.Entity<LoanApplication>(e =>
        {
            e.ToTable("loan_applications");
            e.HasKey(a => a.Id);

            e.Property(a => a.ApplicationNumber).HasMaxLength(30).IsRequired();
            e.HasIndex(a => a.ApplicationNumber).IsUnique();

            e.Property(a => a.Status).HasConversion<string>().HasMaxLength(25).IsRequired();

            e.Property(a => a.LoanAmount).HasPrecision(12, 2);
            e.Property(a => a.InterestRate).HasPrecision(5, 2);
            e.Property(a => a.Emi).HasPrecision(12, 2);
            e.Property(a => a.DeclaredIncome).HasPrecision(12, 2);
            e.Property(a => a.VerifiedIncome).HasPrecision(12, 2);

            e.Property(a => a.CompanyName).HasMaxLength(120);

            e.Property(a => a.Recommendation).HasConversion<string>().HasMaxLength(15);
            e.Property(a => a.Decision).HasConversion<string>().HasMaxLength(15);

            // Three separate FKs to the same Users table.
            // Restrict delete to avoid multiple cascade paths in PostgreSQL.
            e.HasOne(a => a.Applicant)
             .WithMany(u => u.Applications)
             .HasForeignKey(a => a.ApplicantId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(a => a.Processor)
             .WithMany()
             .HasForeignKey(a => a.ProcessorId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(a => a.Underwriter)
             .WithMany()
             .HasForeignKey(a => a.UnderwriterId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ---------------- Document ----------------
        modelBuilder.Entity<Document>(e =>
        {
            e.ToTable("documents");
            e.HasKey(d => d.Id);

            e.Property(d => d.DocumentType).HasConversion<string>().HasMaxLength(30).IsRequired();
            e.Property(d => d.FileName).HasMaxLength(255).IsRequired();
            e.Property(d => d.FilePath).HasMaxLength(500).IsRequired();
            e.Property(d => d.VerificationStatus).HasConversion<string>().HasMaxLength(15).IsRequired();

            e.HasOne(d => d.Application)
             .WithMany(a => a.Documents)
             .HasForeignKey(d => d.ApplicationId)
             .OnDelete(DeleteBehavior.Cascade); // deleting an application removes its docs
        });

        // ---------------- ApplicationHistory ----------------
        modelBuilder.Entity<ApplicationHistory>(e =>
        {
            e.ToTable("application_history");
            e.HasKey(h => h.Id);

            e.Property(h => h.Action).HasMaxLength(60).IsRequired();
            e.Property(h => h.Details).IsRequired();

            e.HasOne(h => h.Application)
             .WithMany(a => a.History)
             .HasForeignKey(h => h.ApplicationId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(h => h.User)
             .WithMany(u => u.HistoryEntries)
             .HasForeignKey(h => h.UserId)
             .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
