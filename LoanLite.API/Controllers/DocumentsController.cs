using LoanLite.Business.Documents;
using LoanLite.Business.DTOs;
using LoanLite.DataAccess.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LoanLite.API.Controllers;

[ApiController]
[Route("api/applications/{applicationId:long}/documents")]
[Authorize]
public sealed class DocumentsController : ControllerBase
{
    private const long RequestLimitBytes = 6 * 1024 * 1024;
    private readonly IDocumentService _service;

    public DocumentsController(IDocumentService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DocumentResponse>>> List(long applicationId) =>
        Ok(await _service.ListAsync(applicationId));

    [HttpPost]
    [Authorize(Roles = "Applicant")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(RequestLimitBytes)]
    public async Task<ActionResult<DocumentResponse>> Upload(
        long applicationId,
        [FromForm] DocumentType documentType,
        [FromForm] IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file is null)
            return BadRequest(new { title = "Validation failed", detail = "A file is required." });

        await using var stream = file.OpenReadStream();
        var created = await _service.UploadAsync(
            applicationId,
            documentType,
            file.FileName,
            file.ContentType,
            file.Length,
            stream,
            cancellationToken);

        return CreatedAtAction(
            nameof(Download),
            new { applicationId, documentId = created.Id },
            created);
    }

    [HttpGet("{documentId:long}/download")]
    public async Task<IActionResult> Download(long applicationId, long documentId)
    {
        var document = await _service.GetDownloadAsync(applicationId, documentId);
        return PhysicalFile(
            document.FullPath,
            document.ContentType,
            document.DownloadFileName,
            enableRangeProcessing: true);
    }

    [HttpPost("{documentId:long}/verify")]
    [Authorize(Roles = "Processor")]
    public async Task<ActionResult<DocumentResponse>> Verify(
        long applicationId,
        long documentId,
        [FromBody] VerifyDocumentRequest request) =>
        Ok(await _service.VerifyAsync(applicationId, documentId, request));

    [HttpDelete("{documentId:long}")]
    [Authorize(Roles = "Applicant")]
    public async Task<IActionResult> Delete(long applicationId, long documentId)
    {
        await _service.DeleteAsync(applicationId, documentId);
        return NoContent();
    }
}
