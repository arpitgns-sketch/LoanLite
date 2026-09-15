using LoanLite.Business.DTOs;

namespace LoanLite.Business.Services;

/// <summary>
/// Orchestrates the whole application lifecycle. Every state-changing method:
///   1. loads the application,
///   2. checks ownership / role,
///   3. asks ApplicationStateMachine whether the move is legal,
///   4. applies the change + side-effects,
///   5. writes one ApplicationHistory audit row,
///   6. saves and returns the fresh state.
/// The controller stays thin and just forwards calls here.
/// </summary>
public interface IApplicationService
{
    // ---- Applicant: create & edit ----
    Task<ApplicationResponse> CreateDraftAsync(CreateApplicationRequest request);
    Task<ApplicationResponse> UpdateDraftAsync(long id, UpdateApplicationRequest request);

    // ---- Reads ----
    Task<ApplicationResponse> GetByIdAsync(long id);
    Task<IReadOnlyList<ApplicationListItem>> GetMineAsync();
    Task<IReadOnlyList<ApplicationHistoryResponse>> GetHistoryAsync(long id);

    // ---- Applicant: lifecycle ----
    Task<ApplicationResponse> SubmitAsync(long id);
    Task<ApplicationResponse> ReuploadAsync(long id);
    Task<ApplicationResponse> WithdrawAsync(long id);

    // ---- Processor: lifecycle ----
    Task<ApplicationResponse> PickupAsync(long id);
    Task<ApplicationResponse> RequestDocumentsAsync(long id, RequestDocumentsRequest request);
    Task<ApplicationResponse> ReferAsync(long id, SimpleReasonRequest request);

    // ---- Underwriter: lifecycle ----
    Task<ApplicationResponse> DecideAsync(long id, DecisionRequest request);
    Task<ApplicationResponse> SendBackAsync(long id, SimpleReasonRequest request);

    // ---- Work lists ----
    Task<PagedResult<ApplicationListItem>> GetProcessorWorkListAsync(WorkListQuery query);
    Task<PagedResult<ApplicationListItem>> GetUnderwriterWorkListAsync(WorkListQuery query);
}
