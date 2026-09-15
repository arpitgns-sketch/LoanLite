using LoanLite.Business.DTOs;
using LoanLite.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LoanLite.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Public self-registration. Always creates an Applicant regardless of the role sent,
    /// because allowStaffRoles is false.
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        try
        {
            var result = await _authService.RegisterAsync(request, allowStaffRoles: false);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>Login with email + password; returns a JWT on success.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        try
        {
            var result = await _authService.LoginAsync(request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Admin-only endpoint to create staff accounts (Processor / Underwriter / Admin).
    /// allowStaffRoles is true here, so the requested role is honoured.
    /// </summary>
    [HttpPost("staff")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateStaff(RegisterRequest request)
    {
        try
        {
            var result = await _authService.RegisterAsync(request, allowStaffRoles: true);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>Quick check that the JWT works and roles flow through correctly.</summary>
    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        return Ok(new
        {
            userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value,
            name = User.Identity?.Name,
            role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
        });
    }
}
