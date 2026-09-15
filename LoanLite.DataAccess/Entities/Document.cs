using LoanLite.DataAccess.Enums;

namespace LoanLite.DataAccess.Entities;

/// <summary>
/// An uploaded supporting file (PAN card, salary slip, ...) for one application.
/// </summary>
public class Document
{
    public long Id { get; set; }

    /// <summary>Enum instead of string for type-safety (design improvement over the diagram).</summary>
    public DocumentType DocumentType { get; set; }

    public string FileName { get; set; } = null!;
    public string FilePath { get; set; } = null!;

    public VerificationStatus VerificationStatus { get; set; } = VerificationStatus.Pending;

    public string? Remarks { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // ---- Foreign key ----
    public long ApplicationId { get; set; }

    // ---- Navigation ----
    public LoanApplication Application { get; set; } = null!;
}
