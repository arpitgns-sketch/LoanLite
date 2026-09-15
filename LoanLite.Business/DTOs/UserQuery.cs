namespace LoanLite.Business.DTOs;

/// <summary>
/// Query parameters for GET /api/admin/users.
/// Search matches name, email and phone. Role is optional.
/// </summary>
public class UserQuery
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

    public string? Search { get; set; }

    /// <summary>Applicant | Processor | Underwriter | Admin.</summary>
    public string? Role { get; set; }

    /// <summary>Newest users first when true; oldest first when false.</summary>
    public bool Desc { get; set; } = true;
}
