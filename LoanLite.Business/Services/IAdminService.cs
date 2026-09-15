using LoanLite.Business.DTOs;

namespace LoanLite.Business.Services;

/// <summary>
/// Admin-only operations used by administration screens.
/// </summary>
public interface IAdminService
{
    Task<PagedResult<AuditLogItem>> GetAuditLogAsync(
        AuditLogQuery query);

    Task<PagedResult<UserListItem>> GetUsersAsync(
        UserQuery query);

    Task<AdminDashboardResponse> GetDashboardAsync();
}