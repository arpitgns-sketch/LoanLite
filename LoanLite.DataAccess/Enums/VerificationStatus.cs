namespace LoanLite.DataAccess.Enums;

/// <summary>
/// Design improvement over the raw "string" in the diagram: verification
/// state of an uploaded document, set by the Processor.
/// </summary>
public enum VerificationStatus
{
    Pending,
    Verified,
    Rejected
}
