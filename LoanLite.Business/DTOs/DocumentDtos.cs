using LoanLite.DataAccess.Enums;

namespace LoanLite.Business.DTOs;

public sealed class DocumentResponse
{
    public long Id { get; init; }
    public long ApplicationId { get; init; }
    public DocumentType DocumentType { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = "application/octet-stream";
    public long SizeBytes { get; init; }
    public VerificationStatus Status { get; init; }
    public DateTime UploadedAt { get; init; }
    public DateTime? VerifiedAt { get; init; }
    public string? VerifiedByName { get; init; }
    public string? RejectionReason { get; init; }
}

public sealed class VerifyDocumentRequest
{
    public VerificationStatus Status { get; init; }
    public string? RejectionReason { get; init; }
}
