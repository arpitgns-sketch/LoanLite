using System.ComponentModel.DataAnnotations;

namespace LoanLite.Business.DTOs;

/// <summary>Processor asks the Applicant for missing/incorrect documents.</summary>
public class RequestDocumentsRequest
{
    [Required, MaxLength(500)]
    public string Reason { get; set; } = null!;
}
