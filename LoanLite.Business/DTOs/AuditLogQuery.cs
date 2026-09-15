namespace LoanLite.Business.DTOs;

/// <summary>
/// Query parameters for GET /api/admin/audit.
/// Example: ?page=1&amp;pageSize=20&amp;search=LL-2026&amp;role=Processor&amp;desc=true
/// </summary>
public class AuditLogQuery
{
    private int _page = 1;
    private int _pageSize = 20;

    public int Page
    {
        get => _page;
        set => _page = value < 1 ? 1 : value;
    }

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value is < 1 or > 100 ? 20 : value;
    }

    /// <summary>
    /// Searches application number, action, details, actor name and actor email.
    /// </summary>
    public string? Search { get; set; }

    /// <summary>Optional exact action filter, such as Submitted or PickedUp.</summary>
    public string? Action { get; set; }

    /// <summary>Optional role filter: Applicant, Processor, Underwriter or Admin.</summary>
    public string? Role { get; set; }

    /// <summary>Optional inclusive UTC lower date/time boundary.</summary>
    public DateTime? FromDate { get; set; }

    /// <summary>Optional inclusive UTC upper date/time boundary.</summary>
    public DateTime? ToDate { get; set; }

    /// <summary>Newest first when true; oldest first when false.</summary>
    public bool Desc { get; set; } = true;
}
