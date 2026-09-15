using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace LoanLite.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FirstName = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    LastName = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Email = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "loan_applications",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ApplicationNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Status = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: false),
                    LoanAmount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    TenureMonths = table.Column<int>(type: "integer", nullable: false),
                    InterestRate = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    Emi = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    CompanyName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    LastSalaryDate = table.Column<DateOnly>(type: "date", nullable: true),
                    DeclaredIncome = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    VerifiedIncome = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    CreditScore = table.Column<int>(type: "integer", nullable: true),
                    Recommendation = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    RecommendationReason = table.Column<string>(type: "text", nullable: true),
                    Decision = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    DecisionComments = table.Column<string>(type: "text", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ApplicantId = table.Column<long>(type: "bigint", nullable: false),
                    ProcessorId = table.Column<long>(type: "bigint", nullable: true),
                    UnderwriterId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_loan_applications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_loan_applications_users_ApplicantId",
                        column: x => x.ApplicantId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_loan_applications_users_ProcessorId",
                        column: x => x.ProcessorId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_loan_applications_users_UnderwriterId",
                        column: x => x.UnderwriterId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "application_history",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Action = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Details = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ApplicationId = table.Column<long>(type: "bigint", nullable: false),
                    UserId = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_application_history", x => x.Id);
                    table.ForeignKey(
                        name: "FK_application_history_loan_applications_ApplicationId",
                        column: x => x.ApplicationId,
                        principalTable: "loan_applications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_application_history_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "documents",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DocumentType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    FileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    VerificationStatus = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    Remarks = table.Column<string>(type: "text", nullable: true),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ApplicationId = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_documents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_documents_loan_applications_ApplicationId",
                        column: x => x.ApplicationId,
                        principalTable: "loan_applications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_application_history_ApplicationId",
                table: "application_history",
                column: "ApplicationId");

            migrationBuilder.CreateIndex(
                name: "IX_application_history_UserId",
                table: "application_history",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_documents_ApplicationId",
                table: "documents",
                column: "ApplicationId");

            migrationBuilder.CreateIndex(
                name: "IX_loan_applications_ApplicantId",
                table: "loan_applications",
                column: "ApplicantId");

            migrationBuilder.CreateIndex(
                name: "IX_loan_applications_ApplicationNumber",
                table: "loan_applications",
                column: "ApplicationNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_loan_applications_ProcessorId",
                table: "loan_applications",
                column: "ProcessorId");

            migrationBuilder.CreateIndex(
                name: "IX_loan_applications_UnderwriterId",
                table: "loan_applications",
                column: "UnderwriterId");

            migrationBuilder.CreateIndex(
                name: "IX_users_Email",
                table: "users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "application_history");

            migrationBuilder.DropTable(
                name: "documents");

            migrationBuilder.DropTable(
                name: "loan_applications");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
