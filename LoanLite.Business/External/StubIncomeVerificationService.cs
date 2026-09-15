using LoanLite.DataAccess.Entities;
using Microsoft.Extensions.Options;

namespace LoanLite.Business.External;

/// <summary>
/// POC stub for income verification. Returns DeclaredIncome × VerifiedIncomeFactor
/// (from "CheckStubs"), or throws when the outage flag is set. This lets you demonstrate
/// the income-match rule (verified vs declared) simply by tuning the factor in config.
/// </summary>
public class StubIncomeVerificationService : IIncomeVerificationService
{
    private readonly CheckStubSettings _cfg;

    public StubIncomeVerificationService(IOptions<CheckStubSettings> cfg) => _cfg = cfg.Value;

    public Task<decimal> GetVerifiedIncomeAsync(LoanApplication app)
    {
        if (_cfg.SimulateIncomeServiceDown)
            throw new ExternalCheckException("Income-verification service is temporarily unavailable.");

        var verified = Math.Round(app.DeclaredIncome * _cfg.VerifiedIncomeFactor, 2);
        return Task.FromResult(verified);
    }
}
