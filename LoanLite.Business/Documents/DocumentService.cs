using LoanLite.Business.DTOs;
using LoanLite.Business.Security;
using LoanLite.Business.Workflow;
using LoanLite.DataAccess.Data;
using LoanLite.DataAccess.Entities;
using LoanLite.DataAccess.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using DocumentEntity = LoanLite.DataAccess.Entities.Document;

namespace LoanLite.Business.Documents;

public sealed class DocumentService : IDocumentService
{
    private static readonly IReadOnlyDictionary<string, string> ContentTypes =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [".pdf"] = "application/pdf",
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".png"] = "image/png"
        };

    private readonly LoanLiteDbContext _db;
    private readonly ICurrentUser _me;
    private readonly DocumentStorageOptions _options;
    private readonly string _rootPath;

    public DocumentService(
        LoanLiteDbContext db,
        ICurrentUser me,
        IOptions<DocumentStorageOptions> options)
    {
        _db = db;
        _me = me;
        _options = options.Value;
        _rootPath = Path.GetFullPath(_options.RootPath);
        Directory.CreateDirectory(_rootPath);
    }

    public async Task<IReadOnlyList<DocumentResponse>> ListAsync(long applicationId)
    {
        var app = await LoadApplicationAsync(applicationId);
        EnsureCanRead(app);

        var documents = await _db.Documents
            .AsNoTracking()
            .Where(d => d.ApplicationId == applicationId)
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync();

        return documents.Select(ToResponse).ToList();
    }

    public async Task<DocumentResponse> UploadAsync(
        long applicationId,
        DocumentType documentType,
        string originalFileName,
        string contentType,
        long length,
        Stream content,
        CancellationToken cancellationToken = default)
    {
        var app = await LoadApplicationAsync(applicationId);
        EnsureApplicantOwner(app);

        if (app.Status is ApplicationStatus.Decided or ApplicationStatus.Withdrawn)
            throw new WorkflowException("Documents cannot be uploaded to a terminal application.");

        ValidateUpload(documentType, originalFileName, contentType, length);

        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
        var applicationFolder = Path.Combine(_rootPath, applicationId.ToString());
        Directory.CreateDirectory(applicationFolder);

        var storedName = $"{Guid.NewGuid():N}{extension}";
        var fullPath = SafeFullPath(Path.Combine(applicationFolder, storedName));
        var relativePath = Path.GetRelativePath(_rootPath, fullPath);

        await using (var output = new FileStream(
            fullPath,
            FileMode.CreateNew,
            FileAccess.Write,
            FileShare.None,
            81920,
            FileOptions.Asynchronous))
        {
            await content.CopyToAsync(output, cancellationToken);
        }

        var document = new DocumentEntity
        {
            ApplicationId = applicationId,
            DocumentType = documentType,
            FileName = Path.GetFileName(originalFileName),
            FilePath = relativePath,
            VerificationStatus = VerificationStatus.Pending,
            Remarks = null,
            UploadedAt = DateTime.UtcNow
        };

        try
        {
            _db.Documents.Add(document);
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            if (File.Exists(fullPath)) File.Delete(fullPath);
            throw;
        }

        return ToResponse(document);
    }

    public async Task<DocumentDownloadResult> GetDownloadAsync(
        long applicationId,
        long documentId)
    {
        var app = await LoadApplicationAsync(applicationId);
        EnsureCanRead(app);
        var document = await LoadDocumentAsync(applicationId, documentId);
        var fullPath = SafeFullPath(Path.Combine(_rootPath, document.FilePath));

        if (!File.Exists(fullPath))
            throw new NotFoundException("The stored document file was not found.");

        return new DocumentDownloadResult(
            fullPath,
            GetContentType(document.FileName),
            document.FileName);
    }

    public async Task<DocumentResponse> VerifyAsync(
        long applicationId,
        long documentId,
        VerifyDocumentRequest request)
    {
        var app = await LoadApplicationAsync(applicationId);
        EnsureAssignedProcessor(app);

        if (request.Status is not VerificationStatus.Verified
            and not VerificationStatus.Rejected)
            throw new ValidationException("Status must be Verified or Rejected.");

        if (request.Status == VerificationStatus.Rejected
            && string.IsNullOrWhiteSpace(request.RejectionReason))
            throw new ValidationException("A rejection reason is required.");

        var document = await LoadDocumentAsync(applicationId, documentId);
        document.VerificationStatus = request.Status;
        document.Remarks = request.Status == VerificationStatus.Rejected
            ? request.RejectionReason!.Trim()
            : null;

        await _db.SaveChangesAsync();
        return ToResponse(document);
    }

    public async Task DeleteAsync(long applicationId, long documentId)
    {
        var app = await LoadApplicationAsync(applicationId);
        EnsureApplicantOwner(app);

        if (app.Status is ApplicationStatus.Decided or ApplicationStatus.Withdrawn)
            throw new WorkflowException("Documents cannot be deleted from a terminal application.");

        var document = await LoadDocumentAsync(applicationId, documentId);
        var fullPath = SafeFullPath(Path.Combine(_rootPath, document.FilePath));

        _db.Documents.Remove(document);
        await _db.SaveChangesAsync();

        if (File.Exists(fullPath)) File.Delete(fullPath);
    }

    private async Task<LoanApplication> LoadApplicationAsync(long id) =>
        await _db.LoanApplications.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id)
        ?? throw new NotFoundException($"Application {id} was not found.");

    private async Task<DocumentEntity> LoadDocumentAsync(long applicationId, long documentId) =>
        await _db.Documents.FirstOrDefaultAsync(
            d => d.Id == documentId && d.ApplicationId == applicationId)
        ?? throw new NotFoundException($"Document {documentId} was not found for application {applicationId}.");

    private void EnsureApplicantOwner(LoanApplication app)
    {
        if (_me.Role != UserRole.Applicant || app.ApplicantId != _me.UserId)
            throw new ForbiddenException("Only the owning applicant can manage these documents.");
    }

    private void EnsureAssignedProcessor(LoanApplication app)
    {
        if (_me.Role != UserRole.Processor || app.ProcessorId != _me.UserId)
            throw new ForbiddenException("Only the assigned Processor can verify these documents.");

        if (app.Status is ApplicationStatus.Decided or ApplicationStatus.Withdrawn)
            throw new WorkflowException("Documents cannot be verified for a terminal application.");
    }

    private void EnsureCanRead(LoanApplication app)
    {
        var allowed = _me.Role switch
        {
            // Applicant may access only their own application.
            UserRole.Applicant =>
                app.ApplicantId == _me.UserId,

            // Processor may open:
            // 1. Submitted applications waiting to be picked up.
            // 2. Applications already assigned to that processor.
            UserRole.Processor =>
                (app.Status == ApplicationStatus.Submitted
                 && app.ProcessorId == null)
                || app.ProcessorId == _me.UserId,

            // Underwriter may access:
            // 1. Referred files.
            // 2. InReview files with a recommendation.
            // 3. Files already decided by that underwriter.
            UserRole.Underwriter =>
                app.Status == ApplicationStatus.Referred
                || (app.Status == ApplicationStatus.InReview
                    && app.Recommendation != null)
                || app.UnderwriterId == _me.UserId,

            // Admin may access everything.
            UserRole.Admin => true,

            _ => false
        };

        if (!allowed)
            throw new ForbiddenException(
                "You are not allowed to access these documents.");
    }

    private void ValidateUpload(
        DocumentType documentType,
        string originalFileName,
        string contentType,
        long length)
    {
        if (!Enum.IsDefined(documentType))
            throw new ValidationException("Invalid document type.");
        if (length <= 0)
            throw new ValidationException("The uploaded file is empty.");
        if (length > _options.MaximumFileSizeBytes)
            throw new ValidationException($"The maximum file size is {_options.MaximumFileSizeBytes / 1024 / 1024} MB.");

        var extension = Path.GetExtension(originalFileName);
        if (!ContentTypes.TryGetValue(extension, out var expectedContentType))
            throw new ValidationException("Only PDF, JPG, JPEG and PNG files are allowed.");
        if (!string.Equals(contentType, expectedContentType, StringComparison.OrdinalIgnoreCase))
            throw new ValidationException("The file extension does not match its content type.");
    }

    private DocumentResponse ToResponse(DocumentEntity document)
    {
        var fullPath = SafeFullPath(Path.Combine(_rootPath, document.FilePath));
        var length = File.Exists(fullPath) ? new FileInfo(fullPath).Length : 0;

        return new DocumentResponse
        {
            Id = document.Id,
            ApplicationId = document.ApplicationId,
            DocumentType = document.DocumentType,
            FileName = document.FileName,
            ContentType = GetContentType(document.FileName),
            SizeBytes = length,
            Status = document.VerificationStatus,
            UploadedAt = document.UploadedAt,
            VerifiedAt = null,
            VerifiedByName = null,
            RejectionReason = document.Remarks
        };
    }

    private string SafeFullPath(string path)
    {
        var fullPath = Path.GetFullPath(path);
        var rootWithSeparator = _rootPath.TrimEnd(Path.DirectorySeparatorChar)
            + Path.DirectorySeparatorChar;

        if (!fullPath.StartsWith(rootWithSeparator, StringComparison.OrdinalIgnoreCase))
            throw new ForbiddenException("Invalid document path.");

        return fullPath;
    }

    private static string GetContentType(string fileName) =>
        ContentTypes.TryGetValue(Path.GetExtension(fileName), out var contentType)
            ? contentType
            : "application/octet-stream";
}
