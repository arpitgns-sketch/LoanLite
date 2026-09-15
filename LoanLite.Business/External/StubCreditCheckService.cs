using LoanLite.DataAccess.Entities;
using Microsoft.Extensions.Options;

namespace LoanLite.Business.External;

/// <summary>
/// POC stub for the credit bureau. Returns the score configured in "CheckStubs",
/// or throws when the outage flag is set (to exercise the "check unavailable → Refer"
/// edge case). Swap this class for a real bureau client in production — nothing else
/// in the app changes, because callers depend on <see cref="ICreditCheckService"/>.
/// </summary>
public class StubCreditCheckService : ICreditCheckService
{
    private readonly CheckStubSettings _cfg;

    public StubCreditCheckService(IOptions<CheckStubSettings> cfg) => _cfg = cfg.Value;

    public Task<int> GetCreditScoreAsync(LoanApplication app)
    {
        if (_cfg.SimulateCreditServiceDown)
            throw new ExternalCheckException("Credit-score service is temporarily unavailable.");

        // Clamp into the valid bureau range just in case someone mis-configures it.
        var score = Math.Clamp(_cfg.CreditScore, 300, 900);
        return Task.FromResult(score);
    }
}
