namespace LoanLite.Business.Assessment;

/// <summary>
/// The automated decisioning engine. Given the assessment inputs it returns a
/// SYSTEM RECOMMENDATION (Approve / Reject / Refer) with a readable reason — it never
/// makes the final Decision. Pure and synchronous, so it can be unit-tested exhaustively.
/// </summary>
public interface IRuleEngine
{
    RuleEngineResult Evaluate(RuleEngineInput input);
}
