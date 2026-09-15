using LoanLite.Business.DTOs;
using LoanLite.DataAccess.Enums;

namespace LoanLite.Business.Documents;

public interface IDocumentService
{
    Task<IReadOnlyList<DocumentResponse>> ListAsync(long applicationId);

    Task<DocumentResponse> UploadAsync(
        long applicationId,
        DocumentType documentType,
        string originalFileName,
        string contentType,
        long length,
        Stream content,
        CancellationToken cancellationToken = default);

    Task<DocumentDownloadResult> GetDownloadAsync(
        long applicationId,
        long documentId);

    Task<DocumentResponse> VerifyAsync(
        long applicationId,
        long documentId,
        VerifyDocumentRequest request);

    Task DeleteAsync(long applicationId, long documentId);
}
