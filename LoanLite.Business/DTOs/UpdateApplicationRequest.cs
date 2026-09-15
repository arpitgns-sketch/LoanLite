using System.ComponentModel.DataAnnotations;

namespace LoanLite.Business.DTOs;

/// <summary>
/// Payload for editing a Draft application (save &amp; finish later). Same shape as
/// create; still lenient because validation happens at Submit.
/// </summary>
public class UpdateApplicationRequest
{
    [Range(50_000, 25_00_000, ErrorMessage = "Loan amount must be between ₹50,000 and ₹25,00,000.")]
    public decimal? LoanAmount { get; set; }

    public int? TenureMonths { get; set; }

    [MaxLength(120)]
    public string? CompanyName { get; set; }

    public DateOnly? LastSalaryDate { get; set; }

    public decimal? DeclaredIncome { get; set; }
}
