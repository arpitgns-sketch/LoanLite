using System.Text.Json.Serialization;
using LoanLite.API;
using LoanLite.Business.Security;
using LoanLite.DataAccess.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------
// SERVICES
// ---------------------------------------------------------------------------

// EF Core + PostgreSQL
builder.Services.AddDbContext<LoanLiteDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Phase 3: JWT auth + password hashing + auth services (see DependencyInjection.cs)
builder.Services.AddLoanLiteAuth(builder.Configuration);

// Phase 4: application workflow (state machine).
builder.Services.AddPhase4Workflow();

builder.Services.AddPhase5RuleEngine(builder.Configuration); // ⬅ Phase 5

builder.Services.AddDocumentManagement(
    builder.Configuration,
    builder.Environment);

// Serialize ALL enums as readable names.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddOpenApi();

// ⬅ CORS: allow the Angular dev server to call this API.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDev", policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod());
});


var app = builder.Build();

// ---------------------------------------------------------------------------
// SEED: create a default Admin if none exists
// ---------------------------------------------------------------------------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LoanLiteDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

    var adminHash = hasher.Hash("Admin@123");
    await DbSeeder.SeedAdminAsync(db, adminHash);
}

// ---------------------------------------------------------------------------
// HTTP REQUEST PIPELINE  (order matters!)
// ---------------------------------------------------------------------------

app.UseMiddleware<WorkflowExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("AllowAngularDev"); // ⬅ CORS: after redirection, before auth.

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();