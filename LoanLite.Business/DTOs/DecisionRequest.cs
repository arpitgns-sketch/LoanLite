using System.ComponentModel.DataAnnotations;
using LoanLite.DataAccess.Enums;

namespace LoanLite.Business.DTOs;

/// <summary>
/// The Underwriter's final call. Only Approve or Reject are valid — this is the one
/// and only way an application reaches the Decided state.
/// </summary>
public class DecisionRequest
{
    [Required]
    public Decision Decision { get; set; }

    [MaxLength(500)]
    public string? Comments { get; set; }
}
