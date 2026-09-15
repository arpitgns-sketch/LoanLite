using LoanLite.Business.DTOs;
using LoanLite.Business.Security;
using LoanLite.Business.Workflow;
using LoanLite.DataAccess.Data;
using LoanLite.DataAccess.Entities;
using LoanLite.DataAccess.Enums;
using Microsoft.EntityFrameworkCore;

namespace LoanLite.Business.Services;

public class ApplicationService : IApplicationService
{
    private readonly LoanLiteDbContext _db;
    private readonly ICurrentUser _me;
    private static readonly int[] AllowedTenures = { 12, 24, 36, 48, 60 };

    public ApplicationService(LoanLiteDbContext db, ICurrentUser me)
    {
        _db = db;
        _me = me;
    }

    public async Task<ApplicationResponse> CreateDraftAsync(CreateApplicationRequest request)
    {
        var app = new LoanApplication
        {
            ApplicationNumber = GenerateApplicationNumber(),
            Status = ApplicationStatus.Draft,
            LoanAmount = request.LoanAmount ?? 0m,
            TenureMonths = request.TenureMonths ?? 0,
            CompanyName = request.CompanyName,
            LastSalaryDate = request.LastSalaryDate,
            DeclaredIncome = request.DeclaredIncome ?? 0m,
            ApplicantId = _me.UserId,
            CreatedAt = DateTime.UtcNow
        };

        _db.LoanApplications.Add(app);
        await _db.SaveChangesAsync();
        AddHistory(app, null, ApplicationStatus.Draft, "Created");
        await _db.SaveChangesAsync();
        return await ToResponseAsync(app.Id);
    }

    public async Task<ApplicationResponse> UpdateDraftAsync(long id, UpdateApplicationRequest request)
    {
        var app = await LoadAsync(id);
        EnsureOwner(app);
        if (app.Status != ApplicationStatus.Draft)
            throw new WorkflowException("Only a Draft application can be edited.");

        app.LoanAmount = request.LoanAmount ?? 0m;
        app.TenureMonths = request.TenureMonths ?? 0;
        app.CompanyName = request.CompanyName;
        app.LastSalaryDate = request.LastSalaryDate;
        app.DeclaredIncome = request.DeclaredIncome ?? 0m;
        app.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return await ToResponseAsync(app.Id);
    }

    public async Task<ApplicationResponse> GetByIdAsync(long id)
    {
        var app = await LoadAsync(id);
        if (_me.Role == UserRole.Applicant && app.ApplicantId != _me.UserId)
            throw new ForbiddenException("You can only view your own application.");
        return await ToResponseAsync(app.Id);
    }

    public async Task<IReadOnlyList<ApplicationListItem>> GetMineAsync()
    {
        return await _db.LoanApplications.AsNoTracking()
            .Where(a => a.ApplicantId == _me.UserId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new ApplicationListItem
            {
                Id = a.Id,
                ApplicationNumber = a.ApplicationNumber,
                Status = a.Status,
                LoanAmount = a.LoanAmount,
                TenureMonths = a.TenureMonths,
                Recommendation = a.Recommendation,
                CreatedAt = a.CreatedAt,
                SubmittedAt = a.SubmittedAt
            }).ToListAsync();
    }

    public async Task<IReadOnlyList<ApplicationHistoryResponse>> GetHistoryAsync(long id)
    {
        var app = await LoadAsync(id);
        if (_me.Role == UserRole.Applicant && app.ApplicantId != _me.UserId)
            throw new ForbiddenException("You can only view the history of your own application.");

        return await _db.ApplicationHistory.AsNoTracking()
            .Where(h => h.ApplicationId == id)
            .OrderBy(h => h.CreatedAt)
            .ThenBy(h => h.Id)
            .Select(h => new ApplicationHistoryResponse
            {
                Id = h.Id,
                ApplicationId = h.ApplicationId,
                ApplicationNumber = h.Application.ApplicationNumber,
                Action = h.Action,
                Details = h.Details,
                PerformedByUserId = h.UserId,
                PerformedByName = h.User.FirstName + " " + h.User.LastName,
                PerformedByEmail = h.User.Email,
                PerformedByRole = h.User.Role,
                CreatedAt = h.CreatedAt
            }).ToListAsync();
    }

    public async Task<ApplicationResponse> SubmitAsync(long id)
    {
        var app = await LoadAsync(id); EnsureOwner(app);
        ApplicationStateMachine.EnsureTransition(app.Status, ApplicationStatus.Submitted, _me.Role);
        ValidateForSubmit(app);
        app.Status = ApplicationStatus.Submitted;
        app.SubmittedAt = DateTime.UtcNow;
        app.UpdatedAt = DateTime.UtcNow;
        AddHistory(app, ApplicationStatus.Draft, ApplicationStatus.Submitted, "Submitted");
        await _db.SaveChangesAsync();
        return await ToResponseAsync(app.Id);
    }

    public async Task<ApplicationResponse> ReuploadAsync(long id)
    {
        var app = await LoadAsync(id); EnsureOwner(app);
        ApplicationStateMachine.EnsureTransition(app.Status, ApplicationStatus.InReview, _me.Role);
        var from = app.Status;
        app.Status = ApplicationStatus.InReview;
        app.UpdatedAt = DateTime.UtcNow;
        AddHistory(app, from, ApplicationStatus.InReview, "Re-uploaded documents");
        await _db.SaveChangesAsync();
        return await ToResponseAsync(app.Id);
    }

    public async Task<ApplicationResponse> WithdrawAsync(long id)
    {
        var app = await LoadAsync(id); EnsureOwner(app);
        ApplicationStateMachine.EnsureTransition(app.Status, ApplicationStatus.Withdrawn, _me.Role);
        var from = app.Status;
        app.Status = ApplicationStatus.Withdrawn;
        app.UpdatedAt = DateTime.UtcNow;
        AddHistory(app, from, ApplicationStatus.Withdrawn, "Withdrawn");
        await _db.SaveChangesAsync();
        return await ToResponseAsync(app.Id);
    }

    public async Task<ApplicationResponse> PickupAsync(long id)
    {
        var app = await LoadAsync(id);
        ApplicationStateMachine.EnsureTransition(app.Status, ApplicationStatus.InReview, _me.Role);
        app.Status = ApplicationStatus.InReview;
        app.ProcessorId = _me.UserId;
        app.UpdatedAt = DateTime.UtcNow;
        AddHistory(app, ApplicationStatus.Submitted, ApplicationStatus.InReview, "PickedUp");
        await _db.SaveChangesAsync();
        return await ToResponseAsync(app.Id);
    }

    public async Task<ApplicationResponse> RequestDocumentsAsync(long id, RequestDocumentsRequest request)
    {
        var app = await LoadAsync(id);
        ApplicationStateMachine.EnsureTransition(app.Status, ApplicationStatus.WaitingForDocuments, _me.Role);
        app.Status = ApplicationStatus.WaitingForDocuments;
        app.UpdatedAt = DateTime.UtcNow;
        AddHistory(app, ApplicationStatus.InReview, ApplicationStatus.WaitingForDocuments, "RequestedDocuments", request.Reason);
        await _db.SaveChangesAsync();
        return await ToResponseAsync(app.Id);
    }

    public async Task<ApplicationResponse> ReferAsync(long id, SimpleReasonRequest request)
    {
        var app = await LoadAsync(id);
        ApplicationStateMachine.EnsureTransition(app.Status, ApplicationStatus.Referred, _me.Role);
        app.Status = ApplicationStatus.Referred;
        app.UpdatedAt = DateTime.UtcNow;
        AddHistory(app, ApplicationStatus.InReview, ApplicationStatus.Referred, "Referred", request.Reason);
        await _db.SaveChangesAsync();
        return await ToResponseAsync(app.Id);
    }

    public async Task<ApplicationResponse> DecideAsync(long id, DecisionRequest request)
    {
        if (request.Decision != Decision.Approve && request.Decision != Decision.Reject)
            throw new ValidationException("Decision must be either Approve or Reject.");
        var app = await LoadAsync(id);
        ApplicationStateMachine.EnsureTransition(app.Status, ApplicationStatus.Decided, _me.Role);
        var from = app.Status;
        app.Status = ApplicationStatus.Decided;
        app.Decision = request.Decision;
        app.DecisionComments = request.Comments;
        app.UnderwriterId = _me.UserId;
        app.UpdatedAt = DateTime.UtcNow;
        AddHistory(app, from, ApplicationStatus.Decided, $"Decided:{request.Decision}", request.Comments);
        await _db.SaveChangesAsync();
        return await ToResponseAsync(app.Id);
    }

    public async Task<ApplicationResponse> SendBackAsync(long id, SimpleReasonRequest request)
    {
        var app = await LoadAsync(id);
        ApplicationStateMachine.EnsureTransition(app.Status, ApplicationStatus.InReview, _me.Role);
        app.Status = ApplicationStatus.InReview;
        app.UpdatedAt = DateTime.UtcNow;
        AddHistory(app, ApplicationStatus.Referred, ApplicationStatus.InReview, "SentBack", request.Reason);
        await _db.SaveChangesAsync();
        return await ToResponseAsync(app.Id);
    }

    public async Task<PagedResult<ApplicationListItem>> GetProcessorWorkListAsync(WorkListQuery query)
    {
        var meId = _me.UserId;
        var q = _db.LoanApplications.AsNoTracking()
            .Where(a => a.Status == ApplicationStatus.Submitted ||
                (a.ProcessorId == meId && (a.Status == ApplicationStatus.InReview || a.Status == ApplicationStatus.WaitingForDocuments)));
        return await PageAsync(q, query);
    }

    public async Task<PagedResult<ApplicationListItem>> GetUnderwriterWorkListAsync(WorkListQuery query)
    {
        var q = _db.LoanApplications.AsNoTracking()
            .Where(a => a.Status == ApplicationStatus.Referred ||
                (a.Status == ApplicationStatus.InReview && a.Recommendation != null));
        return await PageAsync(q, query);
    }

    private async Task<LoanApplication> LoadAsync(long id)
    {
        var app = await _db.LoanApplications.FirstOrDefaultAsync(a => a.Id == id);
        return app ?? throw new NotFoundException($"Application {id} was not found.");
    }

    private void EnsureOwner(LoanApplication app)
    {
        if (app.ApplicantId != _me.UserId)
            throw new ForbiddenException("Only the owning applicant can perform this action.");
    }

    private void ValidateForSubmit(LoanApplication app)
    {
        var errors = new List<string>();
        if (app.LoanAmount is < 50_000 or > 25_00_000)
            errors.Add("Loan amount must be between ₹50,000 and ₹25,00,000.");
        if (Array.IndexOf(AllowedTenures, app.TenureMonths) < 0)
            errors.Add("Please choose a tenure of 12, 24, 36, 48, or 60 months.");
        if (string.IsNullOrWhiteSpace(app.CompanyName))
            errors.Add("Company name is required.");
        if (app.LastSalaryDate is null)
            errors.Add("Last salary date is required.");
        else if (app.LastSalaryDate.Value > DateOnly.FromDateTime(DateTime.UtcNow))
            errors.Add("Last salary date cannot be in the future.");
        if (app.DeclaredIncome <= 0)
            errors.Add("Please enter a valid monthly income.");
        if (errors.Count > 0)
            throw new ValidationException(errors);
    }

    private void AddHistory(LoanApplication app, ApplicationStatus? from, ApplicationStatus to, string action, string? comment = null)
    {
        var details = from.HasValue ? $"Status {from} -> {to}" : $"Status -> {to}";
        if (!string.IsNullOrWhiteSpace(comment)) details += $" ({comment})";
        _db.ApplicationHistory.Add(new ApplicationHistory
        {
            ApplicationId = app.Id,
            UserId = _me.UserId,
            Action = action,
            Details = details,
            CreatedAt = DateTime.UtcNow
        });
    }

    private static string GenerateApplicationNumber()
        => $"LL-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";

    private async Task<PagedResult<ApplicationListItem>> PageAsync(IQueryable<LoanApplication> q, WorkListQuery query)
    {
        if (!string.IsNullOrWhiteSpace(query.Search))
            q = q.Where(a => a.ApplicationNumber.Contains(query.Search));
        bool desc = query.Desc;
        q = (query.SortBy?.ToLowerInvariant()) switch
        {
            "loanamount" => desc ? q.OrderByDescending(a => a.LoanAmount) : q.OrderBy(a => a.LoanAmount),
            "status" => desc ? q.OrderByDescending(a => a.Status) : q.OrderBy(a => a.Status),
            _ => desc ? q.OrderByDescending(a => a.CreatedAt) : q.OrderBy(a => a.CreatedAt)
        };
        var total = await q.CountAsync();
        var items = await q.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize)
            .Select(a => new ApplicationListItem
            {
                Id = a.Id,
                ApplicationNumber = a.ApplicationNumber,
                Status = a.Status,
                LoanAmount = a.LoanAmount,
                TenureMonths = a.TenureMonths,
                ApplicantName = a.Applicant != null ? a.Applicant.FirstName + " " + a.Applicant.LastName : null,
                Recommendation = a.Recommendation,
                CreatedAt = a.CreatedAt,
                SubmittedAt = a.SubmittedAt
            }).ToListAsync();
        return new PagedResult<ApplicationListItem>
        {
            Items = items,
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = total
        };
    }

    private async Task<ApplicationResponse> ToResponseAsync(long id)
    {
        return await _db.LoanApplications.AsNoTracking().Where(a => a.Id == id)
            .Select(a => new ApplicationResponse
            {
                Id = a.Id,
                ApplicationNumber = a.ApplicationNumber,
                Status = a.Status,
                LoanAmount = a.LoanAmount,
                TenureMonths = a.TenureMonths,
                CompanyName = a.CompanyName,
                LastSalaryDate = a.LastSalaryDate,
                DeclaredIncome = a.DeclaredIncome,
                Recommendation = a.Recommendation,
                RecommendationReason = a.RecommendationReason,
                Decision = a.Decision,
                ApplicantId = a.ApplicantId,
                ApplicantName = a.Applicant != null ? a.Applicant.FirstName + " " + a.Applicant.LastName : null,
                ProcessorId = a.ProcessorId,
                UnderwriterId = a.UnderwriterId,
                CreatedAt = a.CreatedAt,
                SubmittedAt = a.SubmittedAt,
                UpdatedAt = a.UpdatedAt
            }).FirstAsync();
    }
}
