namespace LoanLite.DataAccess.Enums;

/// <summary>
/// The final human decision made only by an Underwriter.
/// There is no "Refer" here — a decision is binary.
/// </summary>
public enum Decision
{
    Approve,
    Reject
}
