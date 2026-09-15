using LoanLite.Business.DTOs;
using LoanLite.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LoanLite.API.Controllers;

/// <summary>
/// Thin HTTP surface for the application lifecycle. Every endpoint requires a valid JWT
/// (class-level [Authorize]); role restrictions are applied per action. All the real work
/// lives in the service.
/// </summary>
[ApiController]
[Route("api/applications")]
[Authorize]
public class ApplicationsController : ControllerBase
{
    private readonly IApplicationService _svc;

    public ApplicationsController(IApplicationService svc) => _svc = svc;

    // ---------- Applicant: create & edit ----------

    [HttpPost]
    [Authorize(Roles = "Applicant")]
    public async Task<IActionResult> Create([FromBody] CreateApplicationRequest request)
    {
        var created = await _svc.CreateDraftAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "Applicant")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateApplicationRequest request)
        => Ok(await _svc.UpdateDraftAsync(id, request));

    // ---------- Reads ----------

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
        => Ok(await _svc.GetByIdAsync(id));

    [HttpGet("mine")]
    [Authorize(Roles = "Applicant")]
    public async Task<IActionResult> GetMine()
        => Ok(await _svc.GetMineAsync());

    [HttpGet("{id:long}/history")]
    public async Task<IActionResult> GetHistory(long id)
        => Ok(await _svc.GetHistoryAsync(id));

    // ---------- Applicant: lifecycle ----------

    [HttpPost("{id:long}/submit")]
    [Authorize(Roles = "Applicant")]
    public async Task<IActionResult> Submit(long id)
        => Ok(await _svc.SubmitAsync(id));

    [HttpPost("{id:long}/reupload")]
    [Authorize(Roles = "Applicant")]
    public async Task<IActionResult> Reupload(long id)
        => Ok(await _svc.ReuploadAsync(id));

    [HttpPost("{id:long}/withdraw")]
    [Authorize(Roles = "Applicant")]
    public async Task<IActionResult> Withdraw(long id)
        => Ok(await _svc.WithdrawAsync(id));

    // ---------- Processor: lifecycle ----------

    [HttpPost("{id:long}/pickup")]
    [Authorize(Roles = "Processor")]
    public async Task<IActionResult> Pickup(long id)
        => Ok(await _svc.PickupAsync(id));

    [HttpPost("{id:long}/request-documents")]
    [Authorize(Roles = "Processor")]
    public async Task<IActionResult> RequestDocuments(long id, [FromBody] RequestDocumentsRequest request)
        => Ok(await _svc.RequestDocumentsAsync(id, request));

    [HttpPost("{id:long}/refer")]
    [Authorize(Roles = "Processor")]
    public async Task<IActionResult> Refer(long id, [FromBody] SimpleReasonRequest request)
        => Ok(await _svc.ReferAsync(id, request));

    // ---------- Underwriter: lifecycle ----------

    [HttpPost("{id:long}/decide")]
    [Authorize(Roles = "Underwriter")]
    public async Task<IActionResult> Decide(long id, [FromBody] DecisionRequest request)
        => Ok(await _svc.DecideAsync(id, request));

    [HttpPost("{id:long}/send-back")]
    [Authorize(Roles = "Underwriter")]
    public async Task<IActionResult> SendBack(long id, [FromBody] SimpleReasonRequest request)
        => Ok(await _svc.SendBackAsync(id, request));
}
