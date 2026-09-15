using LoanLite.Business.DTOs;
using LoanLite.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LoanLite.API.Controllers;

/// <summary>
/// Paged, sortable, filterable queues that feed the staff dashboards.
///   • Processor queue    = Submitted items awaiting pickup.
///   • Underwriter queue  = Referred  OR  (In Review with a stored recommendation).
/// Query params: ?page=1&amp;pageSize=20&amp;search=LL-20&amp;sortBy=loanAmount&amp;desc=true
/// </summary>
[ApiController]
[Route("api/worklists")]
[Authorize]
public class WorkListsController : ControllerBase
{
    private readonly IApplicationService _svc;

    public WorkListsController(IApplicationService svc) => _svc = svc;

    [HttpGet("processor")]
    [Authorize(Roles = "Processor")]
    public async Task<IActionResult> Processor([FromQuery] WorkListQuery query)
        => Ok(await _svc.GetProcessorWorkListAsync(query));

    [HttpGet("underwriter")]
    [Authorize(Roles = "Underwriter")]
    public async Task<IActionResult> Underwriter([FromQuery] WorkListQuery query)
        => Ok(await _svc.GetUnderwriterWorkListAsync(query));
}
