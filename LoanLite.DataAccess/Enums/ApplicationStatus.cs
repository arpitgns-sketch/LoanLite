namespace LoanLite.DataAccess.Enums;

/// <summary>
/// The seven lifecycle states. An application is always in exactly one.
/// Decided and Withdrawn are terminal.
/// </summary>
public enum ApplicationStatus
{
    Draft,
    Submitted,
    InReview,
    WaitingForDocuments,
    Referred,
    Decided,
    Withdrawn
}
