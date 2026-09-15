using System.ComponentModel.DataAnnotations;

namespace LoanLite.Business.DTOs;

/// <summary>
/// Optional free-text reason used by actions that benefit from a note but don't
/// need a dedicated DTO — e.g. Refer (escalate) or Send-back to Processor.
/// </summary>
public class SimpleReasonRequest
{
    [MaxLength(500)]
    public string? Reason { get; set; }
}
