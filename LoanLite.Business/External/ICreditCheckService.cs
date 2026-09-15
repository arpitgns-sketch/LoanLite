using LoanLite.DataAccess.Entities;

namespace LoanLite.Business.External;

/// <summary>Provided test service that returns an applicant's credit score (300–900).</summary>
public interface ICreditCheckService
{
    /// <summary>Throws <see cref="ExternalCheckException"/> if the service is unavailable.</summary>
    Task<int> GetCreditScoreAsync(LoanApplication app);
}
