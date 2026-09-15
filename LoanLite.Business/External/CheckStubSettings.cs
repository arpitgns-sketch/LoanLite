namespace LoanLite.Business.External;

/// <summary>
/// Controls the behaviour of the provided TEST services (the POC uses stubs instead of
/// real bureau/payroll integrations). Bound from the "CheckStubs" section of
/// appsettings.json so you can steer the recommendation WITHOUT editing code:
///
///   • Want an APPROVE?  CreditScore 780, VerifiedIncomeFactor 1.0
///   • Want a  REJECT?   CreditScore 550   (or VerifiedIncomeFactor 0.5)
///   • Want a  REFER?    CreditScore 700, VerifiedIncomeFactor 0.9
///   • Simulate an outage → set the corresponding "…ServiceDown" to true (forces Refer)
///
/// Edit the file, restart the API, re-run /run-checks — no rebuild needed.
/// </summary>
public class CheckStubSettings
{
    /// <summary>Credit score (300–900) the stub returns.</summary>
    public int CreditScore { get; set; } = 742;

    /// <summary>Verified income = DeclaredIncome × this factor (e.g. 0.92 = 92%).</summary>
    public decimal VerifiedIncomeFactor { get; set; } = 0.92m;

    /// <summary>When true, the credit service throws → recommendation forced to Refer.</summary>
    public bool SimulateCreditServiceDown { get; set; } = false;

    /// <summary>When true, the income service throws → recommendation forced to Refer.</summary>
    public bool SimulateIncomeServiceDown { get; set; } = false;
}
