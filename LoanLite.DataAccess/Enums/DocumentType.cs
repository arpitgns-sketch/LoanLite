namespace LoanLite.DataAccess.Enums;

/// <summary>
/// Design improvement over the raw "string" in the diagram: an enum gives
/// type-safety and prevents invalid values reaching the database.
/// Extend this list if more document types are needed.
/// </summary>
public enum DocumentType
{
    PanCard,
    SalarySlip
}
