using System.ComponentModel.DataAnnotations;
using LoanLite.DataAccess.Enums;

namespace LoanLite.Business.DTOs;

/// <summary>
/// Payload to create a new user account.
/// Applicants can self-register; staff (Processor/Underwriter/Admin) are created by an Admin.
/// </summary>
public class RegisterRequest
{
    [Required, MaxLength(80)]
    public string FirstName { get; set; } = null!;

    [Required, MaxLength(80)]
    public string LastName { get; set; } = null!;

    [Required, EmailAddress, MaxLength(160)]
    public string Email { get; set; } = null!;

    [Required, RegularExpression(@"^\d{10}$", ErrorMessage = "Enter a valid 10-digit mobile number.")]
    public string Phone { get; set; } = null!;

    [Required, MinLength(8, ErrorMessage = "Password must be at least 8 characters.")]
    public string Password { get; set; } = null!;

    /// <summary>
    /// Desired role. Public self-registration should force this to Applicant in the service;
    /// only an Admin endpoint may set Processor / Underwriter / Admin.
    /// </summary>
    public UserRole Role { get; set; } = UserRole.Applicant;
}
