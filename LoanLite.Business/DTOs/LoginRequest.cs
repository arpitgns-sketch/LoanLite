using System.ComponentModel.DataAnnotations;

namespace LoanLite.Business.DTOs;

/// <summary>Credentials submitted at login.</summary>
public class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    public string Password { get; set; } = null!;
}
