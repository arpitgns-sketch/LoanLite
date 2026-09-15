using LoanLite.Business.DTOs;
using LoanLite.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LoanLite.API.Controllers;

/// <summary>
/// Admin-only endpoints for users, audit activity, and dashboard metrics.
/// </summary>
[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    // ---------- Audit log ----------

    [HttpGet("audit")]
    public async Task<IActionResult> GetAuditLog(
        [FromQuery] AuditLogQuery query)
    {
        var result = await _adminService.GetAuditLogAsync(query);
        return Ok(result);
    }

    // ---------- User management ----------

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] UserQuery query)
    {
        var result = await _adminService.GetUsersAsync(query);
        return Ok(result);
    }

    // ---------- Dashboard ----------

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var result = await _adminService.GetDashboardAsync();
        return Ok(result);
    }
}