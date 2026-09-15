using LoanLite.DataAccess.Enums;

namespace LoanLite.Business.Workflow;

/// <summary>
/// The single source of truth for the application lifecycle.
///
/// It encodes every LEGAL transition from the State-Transition Matrix as a row of
/// (From state, To state, Role allowed to trigger it). Any move that is not in this
/// table is illegal and is rejected — this is the server-side rule book that stops
/// invalid moves (e.g. an Applicant reaching Decided, or skipping Submitted → Decided).
///
/// The state machine only answers "is this move allowed for this role?". It does NOT
/// touch the database, run validation, or write history — that is the ApplicationService's
/// job. Keeping it pure makes it trivial to unit-test with xUnit later.
/// </summary>
public static class ApplicationStateMachine
{
    /// <summary>One legal edge in the lifecycle graph.</summary>
    public readonly record struct Transition(
        ApplicationStatus From,
        ApplicationStatus To,
        UserRole Role);

    // ---------------------------------------------------------------------
    // The transition table — mirrors Section 4 of the State-Transition Matrix.
    // Row numbers in comments match the document for easy cross-checking.
    // ---------------------------------------------------------------------
    private static readonly Transition[] _transitions =
    {
        // 3  Draft            -> Submitted            (Applicant submits)
        new(ApplicationStatus.Draft,               ApplicationStatus.Submitted,            UserRole.Applicant),

        // 4  Submitted        -> InReview            (Processor picks up)
        new(ApplicationStatus.Submitted,           ApplicationStatus.InReview,             UserRole.Processor),

        // 5  InReview         -> WaitingForDocuments (Processor requests docs)
        new(ApplicationStatus.InReview,            ApplicationStatus.WaitingForDocuments,  UserRole.Processor),

        // 6  WaitingForDocs   -> InReview            (Applicant re-uploads)
        new(ApplicationStatus.WaitingForDocuments, ApplicationStatus.InReview,             UserRole.Applicant),

        // 7  InReview         -> Referred            (Processor escalates / system REFER)
        new(ApplicationStatus.InReview,            ApplicationStatus.Referred,             UserRole.Processor),

        // 8  InReview         -> Decided             (Underwriter decides — Option 2 route)
        new(ApplicationStatus.InReview,            ApplicationStatus.Decided,              UserRole.Underwriter),

        // 9  Referred         -> Decided             (Underwriter decides)
        new(ApplicationStatus.Referred,            ApplicationStatus.Decided,              UserRole.Underwriter),

        // 10 Referred         -> InReview            (Underwriter sends back)
        new(ApplicationStatus.Referred,            ApplicationStatus.InReview,             UserRole.Underwriter),

        // 11 Any pre-decision -> Withdrawn           (Applicant withdraws)
        new(ApplicationStatus.Draft,               ApplicationStatus.Withdrawn,            UserRole.Applicant),
        new(ApplicationStatus.Submitted,           ApplicationStatus.Withdrawn,            UserRole.Applicant),
        new(ApplicationStatus.InReview,            ApplicationStatus.Withdrawn,            UserRole.Applicant),
        new(ApplicationStatus.WaitingForDocuments, ApplicationStatus.Withdrawn,            UserRole.Applicant),
        new(ApplicationStatus.Referred,            ApplicationStatus.Withdrawn,            UserRole.Applicant),
    };

    /// <summary>Terminal states — nothing can leave them.</summary>
    private static readonly HashSet<ApplicationStatus> _terminal = new()
    {
        ApplicationStatus.Decided,
        ApplicationStatus.Withdrawn
    };

    public static bool IsTerminal(ApplicationStatus status) => _terminal.Contains(status);

    /// <summary>
    /// True if the given role may move an application from <paramref name="from"/>
    /// to <paramref name="to"/>.
    /// </summary>
    public static bool CanTransition(ApplicationStatus from, ApplicationStatus to, UserRole role)
    {
        foreach (var t in _transitions)
            if (t.From == from && t.To == to && t.Role == role)
                return true;
        return false;
    }

    /// <summary>
    /// Throws <see cref="WorkflowException"/> if the move is not allowed. Use this at
    /// the top of every state-changing service method so the rule is enforced in one place.
    /// </summary>
    public static void EnsureTransition(ApplicationStatus from, ApplicationStatus to, UserRole role)
    {
        if (IsTerminal(from))
            throw new WorkflowException(
                $"Application is already {from} (terminal) and cannot change state.");

        if (!CanTransition(from, to, role))
            throw new WorkflowException(
                $"This action is not allowed: a {role} cannot move an application from {from} to {to}.");
    }

    /// <summary>
    /// Lists every state a role may reach from the current state — handy for the
    /// frontend to enable/disable action buttons, or for debugging.
    /// </summary>
    public static IReadOnlyList<ApplicationStatus> AllowedNextStates(
        ApplicationStatus from, UserRole role)
    {
        var result = new List<ApplicationStatus>();
        foreach (var t in _transitions)
            if (t.From == from && t.Role == role)
                result.Add(t.To);
        return result;
    }
}
