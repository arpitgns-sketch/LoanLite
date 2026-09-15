namespace LoanLite.DataAccess.Enums;

/// <summary>
/// Output of the automated rule engine. This is only a SYSTEM SUGGESTION;
/// it never moves an application to Decided.
/// </summary>
public enum Recommendation
{
    Approve,
    Reject,
    Refer
}
