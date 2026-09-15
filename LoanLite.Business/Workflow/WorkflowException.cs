namespace LoanLite.Business.Workflow;

/// <summary>
/// Thrown when a requested lifecycle move is not allowed — either the transition
/// itself is illegal (per the State-Transition Matrix) or the acting role/owner
/// is not permitted to perform it. The API layer maps this to HTTP 409 Conflict.
/// </summary>
public class WorkflowException : Exception
{
    public WorkflowException(string message) : base(message) { }
}
