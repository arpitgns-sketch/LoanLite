namespace LoanLite.Business.DTOs;

/// <summary>
/// Generic paging envelope for work lists. Carries the current page of items plus the
/// metadata the frontend needs to render pager controls.
/// </summary>
public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; set; } = new List<T>();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => PageSize == 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
}

/// <summary>
/// Common query parameters for the paged, sortable, filterable work lists.
/// Bound from the query string, e.g. ?page=1&amp;pageSize=20&amp;search=LL-20&amp;sortBy=loanAmount&amp;desc=true
/// </summary>
public class WorkListQuery
{
    private int _page = 1;
    private int _pageSize = 20;

    public int Page { get => _page; set => _page = value < 1 ? 1 : value; }
    public int PageSize { get => _pageSize; set => _pageSize = value is < 1 or > 100 ? 20 : value; }

    /// <summary>Matches the application number (contains).</summary>
    public string? Search { get; set; }

    /// <summary>createdAt | loanAmount | status (defaults to createdAt).</summary>
    public string? SortBy { get; set; }

    public bool Desc { get; set; }
}
