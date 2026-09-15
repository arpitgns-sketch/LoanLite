using LoanLite.Business.DTOs;

namespace LoanLite.Business.Services;

/// <summary>
/// Orchestrates the automated assessment (Phase 5). One entry point: run the outside
/// checks, compute + freeze the EMI, produce a recommendation, persist everything, and
/// route the file to the Underwriter queue.
/// </summary>
public interface IAssessmentService
{
    /// <summary>
    /// Runs credit + income checks, computes EMI/FOIR, evaluates the rule engine, stores
    /// the results and a recommendation reason, writes an audit row, and updates status:
    ///   • Refer            → application moves to Referred.
    ///   • Approve / Reject → application stays In Review WITH a stored recommendation,
    ///                        which places it on the Underwriter work list (Option 2).
    /// The recommendation is never final — only an Underwriter can reach Decided.
    /// </summary>
    Task<RunChecksResponse> RunChecksAsync(long id);
}
