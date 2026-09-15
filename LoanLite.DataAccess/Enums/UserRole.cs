namespace LoanLite.DataAccess.Enums;

/// <summary>
/// The four (and only four) roles supported by LoanLite.
/// Role-based access control (JWT) is built on top of this.
/// </summary>
public enum UserRole
{
    Applicant,
    Processor,
    Underwriter,
    Admin
}
