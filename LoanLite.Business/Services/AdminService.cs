using LoanLite.Business.DTOs;
using LoanLite.Business.Workflow;
using LoanLite.DataAccess.Data;
using LoanLite.DataAccess.Enums;
using Microsoft.EntityFrameworkCore;

namespace LoanLite.Business.Services;

/// <summary>
/// Provides read-only administration queries. Admin authorization is enforced
/// by AdminController. This service validates filters and projects safe DTOs.
/// Password hashes are never returned.
/// </summary>
public class AdminService : IAdminService
{
    private readonly LoanLiteDbContext _db;

    public AdminService(LoanLiteDbContext db)
    {
        _db = db;
    }

    // =====================================================================
    // AUDIT LOG
    // =====================================================================

    public async Task<PagedResult<AuditLogItem>> GetAuditLogAsync(
        AuditLogQuery query)
    {
        var audit = _db.ApplicationHistory
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();

            audit = audit.Where(h =>
                h.Application.ApplicationNumber
                    .ToLower()
                    .Contains(search) ||
                h.Action.ToLower().Contains(search) ||
                h.Details.ToLower().Contains(search) ||
                h.User.FirstName.ToLower().Contains(search) ||
                h.User.LastName.ToLower().Contains(search) ||
                (h.User.FirstName + " " + h.User.LastName)
                    .ToLower()
                    .Contains(search) ||
                h.User.Email.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(query.Action))
        {
            var action = query.Action.Trim().ToLower();

            audit = audit.Where(
                h => h.Action.ToLower() == action);
        }

        if (!string.IsNullOrWhiteSpace(query.Role))
        {
            if (!Enum.TryParse<UserRole>(
                    query.Role.Trim(),
                    true,
                    out var role))
            {
                throw new ValidationException(
                    "Role must be Applicant, Processor, Underwriter, or Admin.");
            }

            audit = audit.Where(h => h.User.Role == role);
        }

        if (query.FromDate.HasValue)
        {
            audit = audit.Where(
                h => h.CreatedAt >= query.FromDate.Value);
        }

        if (query.ToDate.HasValue)
        {
            audit = audit.Where(
                h => h.CreatedAt <= query.ToDate.Value);
        }

        if (query.FromDate.HasValue &&
            query.ToDate.HasValue &&
            query.FromDate.Value > query.ToDate.Value)
        {
            throw new ValidationException(
                "FromDate cannot be later than ToDate.");
        }

        audit = query.Desc
            ? audit
                .OrderByDescending(h => h.CreatedAt)
                .ThenByDescending(h => h.Id)
            : audit
                .OrderBy(h => h.CreatedAt)
                .ThenBy(h => h.Id);

        var totalCount = await audit.CountAsync();

        var items = await audit
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(h => new AuditLogItem
            {
                Id = h.Id,
                ApplicationId = h.ApplicationId,
                ApplicationNumber =
                    h.Application.ApplicationNumber,
                Action = h.Action,
                Details = h.Details,
                PerformedByUserId = h.UserId,
                PerformedByName =
                    h.User.FirstName + " " + h.User.LastName,
                PerformedByEmail = h.User.Email,
                PerformedByRole = h.User.Role,
                CreatedAt = h.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<AuditLogItem>
        {
            Items = items,
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = totalCount
        };
    }

    // =====================================================================
    // USER MANAGEMENT
    // =====================================================================

    public async Task<PagedResult<UserListItem>> GetUsersAsync(
        UserQuery query)
    {
        var users = _db.Users
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();

            users = users.Where(u =>
                u.FirstName.ToLower().Contains(search) ||
                u.LastName.ToLower().Contains(search) ||
                (u.FirstName + " " + u.LastName)
                    .ToLower()
                    .Contains(search) ||
                u.Email.ToLower().Contains(search) ||
                u.Phone.Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(query.Role))
        {
            if (!Enum.TryParse<UserRole>(
                    query.Role.Trim(),
                    true,
                    out var role))
            {
                throw new ValidationException(
                    "Role must be Applicant, Processor, Underwriter, or Admin.");
            }

            users = users.Where(u => u.Role == role);
        }

        users = query.Desc
            ? users
                .OrderByDescending(u => u.CreatedAt)
                .ThenByDescending(u => u.Id)
            : users
                .OrderBy(u => u.CreatedAt)
                .ThenBy(u => u.Id);

        var totalCount = await users.CountAsync();

        var items = await users
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(u => new UserListItem
            {
                Id = u.Id,
                FullName = u.FirstName + " " + u.LastName,
                Email = u.Email,
                Phone = u.Phone,
                Role = u.Role,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<UserListItem>
        {
            Items = items,
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = totalCount
        };
    }

    // =====================================================================
    // ADMIN DASHBOARD
    // =====================================================================

    public async Task<AdminDashboardResponse> GetDashboardAsync()
    {
        var userCounts = await _db.Users
            .AsNoTracking()
            .GroupBy(user => user.Role)
            .Select(group => new
            {
                Role = group.Key,
                Count = group.Count()
            })
            .ToListAsync();

        var applicationCounts = await _db.LoanApplications
            .AsNoTracking()
            .GroupBy(application => application.Status)
            .Select(group => new
            {
                Status = group.Key,
                Count = group.Count()
            })
            .ToListAsync();

        var totalAuditRecords = await _db.ApplicationHistory
            .AsNoTracking()
            .CountAsync();

        return new AdminDashboardResponse
        {
            TotalUsers = userCounts.Sum(item => item.Count),

            Applicants = userCounts
                .Where(item => item.Role == UserRole.Applicant)
                .Select(item => item.Count)
                .FirstOrDefault(),

            Processors = userCounts
                .Where(item => item.Role == UserRole.Processor)
                .Select(item => item.Count)
                .FirstOrDefault(),

            Underwriters = userCounts
                .Where(item => item.Role == UserRole.Underwriter)
                .Select(item => item.Count)
                .FirstOrDefault(),

            Admins = userCounts
                .Where(item => item.Role == UserRole.Admin)
                .Select(item => item.Count)
                .FirstOrDefault(),

            TotalApplications =
                applicationCounts.Sum(item => item.Count),

            Draft = applicationCounts
                .Where(item =>
                    item.Status == ApplicationStatus.Draft)
                .Select(item => item.Count)
                .FirstOrDefault(),

            Submitted = applicationCounts
                .Where(item =>
                    item.Status == ApplicationStatus.Submitted)
                .Select(item => item.Count)
                .FirstOrDefault(),

            InReview = applicationCounts
                .Where(item =>
                    item.Status == ApplicationStatus.InReview)
                .Select(item => item.Count)
                .FirstOrDefault(),

            WaitingForDocuments = applicationCounts
                .Where(item =>
                    item.Status ==
                    ApplicationStatus.WaitingForDocuments)
                .Select(item => item.Count)
                .FirstOrDefault(),

            Referred = applicationCounts
                .Where(item =>
                    item.Status == ApplicationStatus.Referred)
                .Select(item => item.Count)
                .FirstOrDefault(),

            Decided = applicationCounts
                .Where(item =>
                    item.Status == ApplicationStatus.Decided)
                .Select(item => item.Count)
                .FirstOrDefault(),

            Withdrawn = applicationCounts
                .Where(item =>
                    item.Status == ApplicationStatus.Withdrawn)
                .Select(item => item.Count)
                .FirstOrDefault(),

            TotalAuditRecords = totalAuditRecords
        };
    }
}