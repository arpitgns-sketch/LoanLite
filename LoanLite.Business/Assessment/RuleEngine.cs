using LoanLite.DataAccess.Enums;
using Microsoft.Extensions.Options;

namespace LoanLite.Business.Assessment;

/// <summary>
/// Concrete rule engine — a faithful, line-for-line implementation of the reference
/// pseudocode in the Business Rules Document (§8), using the tunable thresholds from
/// <see cref="RuleSettings"/>. Rules are evaluated IN ORDER; the first match wins.
///
///   1. Hard Reject   — any single disqualifier (checked first)
///   2. Auto-Approve  — all "clean" conditions true
///   3. Refer         — everything in between (needs a human underwriter)
/// </summary>
public class RuleEngine : IRuleEngine
{
    private readonly RuleSettings _s;

    public RuleEngine(IOptions<RuleSettings> settings) => _s = settings.Value;

    public RuleEngineResult Evaluate(RuleEngineInput input)
    {
        // ---- Derived figures ----
        var emi = EmiCalculator.Compute(input.LoanAmount, _s.AnnualInterestRatePercent, input.TenureMonths);

        // Affordability & income-match. Guard against divide-by-zero.
        decimal foir  = input.VerifiedIncome > 0 ? emi / input.VerifiedIncome : decimal.MaxValue;
        decimal match = input.DeclaredIncome > 0 ? input.VerifiedIncome / input.DeclaredIncome * 100m : 0m;

        RuleEngineResult Build(Recommendation rec, string reason) => new(
            rec, reason,
            Emi: emi,
            Foir: Math.Round(foir == decimal.MaxValue ? 0m : foir, 4),
            IncomeMatchPercent: Math.Round(match, 2),
            AnnualInterestRatePercent: _s.AnnualInterestRatePercent);

        // ---- Guard: cannot assess without verified income (§9) ----
        if (input.VerifiedIncome <= 0)
            return Build(Recommendation.Reject, "Verified income is zero — cannot assess affordability.");

        // ---- 1. Hard Reject (first match wins) ----
        if (input.CreditScore < _s.MinCreditScoreReject)
            return Build(Recommendation.Reject,
                $"Low credit score ({input.CreditScore} < {_s.MinCreditScoreReject}).");

        if (input.VerifiedIncome < _s.MinVerifiedIncome)
            return Build(Recommendation.Reject,
                $"Verified income ₹{input.VerifiedIncome:N0} is below the minimum ₹{_s.MinVerifiedIncome:N0}.");

        if (match < _s.MinIncomeMatchPercent)
            return Build(Recommendation.Reject,
                $"Verified income is only {match:N0}% of declared (min {_s.MinIncomeMatchPercent:N0}%).");

        if (foir > _s.MaxFoir)
            return Build(Recommendation.Reject,
                $"EMI unaffordable — FOIR {foir:P0} exceeds the {_s.MaxFoir:P0} limit.");

        // ---- 2. Auto-Approve (all clean) ----
        if (input.CreditScore >= _s.MinCreditScoreApprove && foir <= _s.ComfortableFoir)
            return Build(Recommendation.Approve,
                $"Strong credit ({input.CreditScore}) and comfortable EMI (FOIR {foir:P0}).");

        // ---- 3. Refer (everything in between) ----
        return Build(Recommendation.Refer,
            $"Borderline: credit {input.CreditScore}, FOIR {foir:P0}, income match {match:N0}% — needs underwriter review.");
    }
}
