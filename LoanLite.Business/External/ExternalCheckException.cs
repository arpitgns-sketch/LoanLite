namespace LoanLite.Business.External;

/// <summary>
/// Raised when a provided test service (credit score or income verification) is
/// unavailable. Per the Business Rules edge-cases (§9), the system must NOT auto-decide
/// in this situation — the AssessmentService catches this and forces a Refer.
/// </summary>
public class ExternalCheckException : Exception
{
    public ExternalCheckException(string message) : base(message) { }
}
