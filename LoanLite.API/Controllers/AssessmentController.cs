using LoanLite.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LoanLite.API.Controllers;

/// <summary>
/// Phase 5 endpoint. Kept in its own controller so the Phase 4 ApplicationsController
/// stays untouched — both share the "api/applications" prefix, which ASP.NET allows as
/// long as the action routes differ.
/// </summary>
[ApiController]
[Route("api/applications")]
[Authorize]
public class AssessmentController : ControllerBase
{
    private readonly IAssessmentService _assessment;

    public AssessmentController(IAssessmentService assessment) => _assessment = assessment;

    /// <summary>
    /// POST /api/applications/{id}/run-checks
    /// Runs credit + income checks, computes EMI, and produces a system recommendation.
    /// Processor-only; the application must be In Review.
    /// </summary>
    [HttpPost("{id:long}/run-checks")]
    [Authorize(Roles = "Processor")]
    public async Task<IActionResult> RunChecks(long id)
        => Ok(await _assessment.RunChecksAsync(id));
}
