namespace LoanLite.Business.Workflow;

/// <summary>Requested application does not exist. API maps to HTTP 404.</summary>
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}

/// <summary>Caller is authenticated but not allowed to touch this resource. API maps to HTTP 403.</summary>
public class ForbiddenException : Exception
{
    public ForbiddenException(string message) : base(message) { }
}

/// <summary>Field-level validation failed (e.g. at Submit). API maps to HTTP 400.</summary>
public class ValidationException : Exception
{
    public IReadOnlyList<string> Errors { get; }

    public ValidationException(IReadOnlyList<string> errors)
        : base("One or more validation errors occurred.")
        => Errors = errors;

    public ValidationException(string error) : this(new[] { error }) { }
}
