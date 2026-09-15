using System.Text.Json;
using LoanLite.Business.Workflow;

namespace LoanLite.API;

/// <summary>
/// Translates the Business-layer domain exceptions into clean HTTP responses with a
/// consistent JSON body, so controllers can stay one-liners and never wrap calls in
/// try/catch. Register it early in the pipeline (see PHASE4_WORKFLOW_SETUP.md):
///     app.UseMiddleware&lt;WorkflowExceptionMiddleware&gt;();
///
/// Mapping:
///   NotFoundException    → 404 Not Found
///   ForbiddenException   → 403 Forbidden
///   ValidationException  → 400 Bad Request  (+ errors[])
///   WorkflowException    → 409 Conflict     (illegal state transition)
///   anything else        → 500 Internal Server Error
/// </summary>
public class WorkflowExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<WorkflowExceptionMiddleware> _logger;

    public WorkflowExceptionMiddleware(RequestDelegate next, ILogger<WorkflowExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await _next(ctx);
        }
        catch (NotFoundException ex)   { await WriteAsync(ctx, StatusCodes.Status404NotFound, "Not Found", ex.Message); }
        catch (ForbiddenException ex)  { await WriteAsync(ctx, StatusCodes.Status403Forbidden, "Forbidden", ex.Message); }
        catch (ValidationException ex) { await WriteAsync(ctx, StatusCodes.Status400BadRequest, ex.Message, null, ex.Errors); }
        catch (WorkflowException ex)   { await WriteAsync(ctx, StatusCodes.Status409Conflict, "Conflict", ex.Message); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            await WriteAsync(ctx, StatusCodes.Status500InternalServerError,
                             "Server Error", "An unexpected error occurred.");
        }
    }

    private static async Task WriteAsync(HttpContext ctx, int status, string title,
                                         string? detail, IReadOnlyList<string>? errors = null)
    {
        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = "application/json";

        var payload = new
        {
            status,
            title,
            detail,
            errors
        };

        await ctx.Response.WriteAsync(JsonSerializer.Serialize(payload,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
    }
}
