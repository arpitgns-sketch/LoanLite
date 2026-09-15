using LoanLite.Business.Assessment;
using LoanLite.Business.DTOs;
using LoanLite.Business.External;
using LoanLite.Business.Security;
using LoanLite.Business.Workflow;
using LoanLite.DataAccess.Data;
using LoanLite.DataAccess.Entities;
using LoanLite.DataAccess.Enums;
using Microsoft.EntityFrameworkCore;

namespace LoanLite.Business.Services;

/// <summary>
/// Concrete Phase 5 orchestrator. Ties together the external checks, the EMI calculator,
/// and the rule engine, then persists the outcome and moves the application appropriately.
///
/// Flow (matches Business Rules §5–§7 and State-Transition Matrix §2.1 / row 7):
///   1. Load the application; require it to be In Review.
///   2. Call the credit + income test services. If EITHER is unavailable → force Refer
///      (never auto-decide on a missing check — §9).
///   3. Otherwise run the rule engine to get Approve / Reject / Refer + a reason.
///   4. Freeze EMI, store CreditScore, VerifiedIncome, InterestRate, Recommendation.
///   5. Refer → transition In Review → Referred. Approve/Reject → stay In Review (the
///      stored recommendation puts it on the Underwriter queue via Option 2).
///   6. Write one audit-history row and save.
/// </summary>
public class AssessmentService : IAssessmentService
{
    private readonly LoanLiteDbContext _db;
    private readonly ICurrentUser _me;
    private readonly ICreditCheckService _credit;
    private readonly IIncomeVerificationService _income;
    private readonly IRuleEngine _engine;

    public AssessmentService(
        LoanLiteDbContext db,
        ICurrentUser me,
        ICreditCheckService credit,
        IIncomeVerificationService income,
        IRuleEngine engine)
    {
        _db = db;
        _me = me;
        _credit = credit;
        _income = income;
        _engine = engine;
    }

    public async Task<RunChecksResponse> RunChecksAsync(long id)
    {
        var app = await _db.LoanApplications.FirstOrDefaultAsync(a => a.Id == id)
                  ?? throw new NotFoundException($"Application {id} was not found.");

        // Checks only make sense while a Processor is actively reviewing the file.
        if (app.Status != ApplicationStatus.InReview)
            throw new WorkflowException(
                $"Checks can only be run while the application is In Review (current: {app.Status}).");

        // ---- 2. Outside checks (credit + income) ----
        int creditScore;
        decimal verifiedIncome;
        try
        {
            creditScore    = await _credit.GetCreditScoreAsync(app);
            verifiedIncome = await _income.GetVerifiedIncomeAsync(app);
        }
        catch (ExternalCheckException ex)
        {
            // A provided service is down → do NOT auto-decide; force a Refer for a human.
            return await ReferUnavailableAsync(app, ex.Message);
        }

        // ---- 3. Rule engine ----
        var result = _engine.Evaluate(new RuleEngineInput(
            LoanAmount:     app.LoanAmount,
            TenureMonths:   app.TenureMonths,
            DeclaredIncome: app.DeclaredIncome,
            VerifiedIncome: verifiedIncome,
            CreditScore:    creditScore));

        // ---- 4. Freeze the assessment onto the application ----
        app.CreditScore          = creditScore;
        app.VerifiedIncome       = verifiedIncome;
        app.InterestRate         = result.AnnualInterestRatePercent;
        app.Emi                  = result.Emi;
        app.Recommendation       = result.Recommendation;
        app.RecommendationReason = result.Reason;
        app.UpdatedAt            = DateTime.UtcNow;

        // ---- 5. Route based on the recommendation ----
        if (result.Recommendation == Recommendation.Refer)
        {
            // System-driven escalation: In Review -> Referred (Matrix row 7).
            ApplicationStateMachine.EnsureTransition(app.Status, ApplicationStatus.Referred, _me.Role);
            app.Status = ApplicationStatus.Referred;
            AddHistory(app, "RanChecks",
                $"Checks done -> REFER. {result.Reason} (score {creditScore}, EMI ₹{result.Emi:N0}, FOIR {result.Foir:P0}). Status InReview -> Referred");
        }
        else
        {
            // Approve/Reject recommendation: stay In Review; the stored recommendation
            // places it on the Underwriter work list (Option 2). Only a UW can Decide.
            AddHistory(app, "RanChecks",
                $"Checks done -> {result.Recommendation.ToString().ToUpper()}. {result.Reason} (score {creditScore}, EMI ₹{result.Emi:N0}, FOIR {result.Foir:P0})");
        }

        await _db.SaveChangesAsync();
        return ToResponse(app, result);
    }

    // ---------------------------------------------------------------------
    //  Helpers
    // ---------------------------------------------------------------------

    /// <summary>Service-unavailable path: force Refer, store nothing we couldn't obtain.</summary>
    private async Task<RunChecksResponse> ReferUnavailableAsync(LoanApplication app, string why)
    {
        var emi = EmiCalculator.Compute(app.LoanAmount, 14.0m, app.TenureMonths);

        app.Emi                  = emi;
        app.InterestRate         = 14.0m;
        app.Recommendation       = Recommendation.Refer;
        app.RecommendationReason = $"Referred: {why} (automatic checks unavailable).";
        app.UpdatedAt            = DateTime.UtcNow;

        ApplicationStateMachine.EnsureTransition(app.Status, ApplicationStatus.Referred, _me.Role);
        app.Status = ApplicationStatus.Referred;

        AddHistory(app, "RanChecks", $"Checks unavailable -> REFER. {why}. Status InReview -> Referred");
        await _db.SaveChangesAsync();

        return new RunChecksResponse
        {
            Id                        = app.Id,
            ApplicationNumber         = app.ApplicationNumber,
            Status                    = app.Status,
            LoanAmount                = app.LoanAmount,
            TenureMonths              = app.TenureMonths,
            AnnualInterestRatePercent = app.InterestRate,
            DeclaredIncome            = app.DeclaredIncome,
            CreditScore               = app.CreditScore,        // null — wasn't obtained
            VerifiedIncome            = app.VerifiedIncome,     // null — wasn't obtained
            IncomeMatchPercent        = 0m,
            Emi                       = emi,
            Foir                      = 0m,
            Recommendation            = app.Recommendation,
            RecommendationReason      = app.RecommendationReason
        };
    }

    private void AddHistory(LoanApplication app, string action, string details)
    {
        _db.ApplicationHistory.Add(new ApplicationHistory
        {
            ApplicationId = app.Id,
            UserId        = _me.UserId,
            Action        = action,
            Details       = details,
            CreatedAt     = DateTime.UtcNow
        });
    }

    private static RunChecksResponse ToResponse(LoanApplication app, RuleEngineResult r) => new()
    {
        Id                        = app.Id,
        ApplicationNumber         = app.ApplicationNumber,
        Status                    = app.Status,
        LoanAmount                = app.LoanAmount,
        TenureMonths              = app.TenureMonths,
        AnnualInterestRatePercent = r.AnnualInterestRatePercent,
        DeclaredIncome            = app.DeclaredIncome,
        CreditScore               = app.CreditScore,
        VerifiedIncome            = app.VerifiedIncome,
        IncomeMatchPercent        = r.IncomeMatchPercent,
        Emi                       = r.Emi,
        Foir                      = r.Foir,
        Recommendation            = app.Recommendation,
        RecommendationReason      = app.RecommendationReason
    };
}
