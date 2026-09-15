using System.ComponentModel.DataAnnotations;

namespace LoanLite.Business.DTOs;

/// <summary>
/// Payload for creating a new Draft application. While in Draft everything is optional
/// (the Applicant can save and finish later); the strict business rules are enforced
/// only at Submit time.
/// </summary>
public class CreateApplicationRequest
{
    [Range(50_000, 25_00_000, ErrorMessage = "Loan amount must be between ₹50,000 and ₹25,00,000.")]
    public decimal? LoanAmount { get; set; }

    public int? TenureMonths { get; set; }

    [MaxLength(120)]
    public string? CompanyName { get; set; }

    public DateOnly? LastSalaryDate { get; set; }

    public decimal? DeclaredIncome { get; set; }
}
