using LoanLite.DataAccess.Enums;

namespace LoanLite.Business.Assessment;

/// <summary>
/// Everything the rule engine needs to make a decision. Kept separate from the entity
/// so the engine stays pure and unit-testable (no EF, no DB).
/// </summary>
public readonly record struct RuleEngineInput(
    decimal LoanAmount,
    int TenureMonths,
    decimal DeclaredIncome,
    decimal VerifiedIncome,
    int CreditScore);

/// <summary>
/// The engine's output: the recommendation plus all the derived figures we want to
/// store on the application and show to staff (§7.5 asks for a readable reason).
/// </summary>
public readonly record struct RuleEngineResult(
    Recommendation Recommendation,
    string Reason,
    decimal Emi,
    decimal Foir,
    decimal IncomeMatchPercent,
    decimal AnnualInterestRatePercent);
