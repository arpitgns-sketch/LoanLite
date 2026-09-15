using LoanLite.DataAccess.Entities;

namespace LoanLite.Business.External;

/// <summary>Provided test service that returns an applicant's verified monthly income.</summary>
public interface IIncomeVerificationService
{
    /// <summary>Throws <see cref="ExternalCheckException"/> if the service is unavailable.</summary>
    Task<decimal> GetVerifiedIncomeAsync(LoanApplication app);
}
