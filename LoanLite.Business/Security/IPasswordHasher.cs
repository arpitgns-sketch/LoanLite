namespace LoanLite.Business.Security;

/// <summary>Abstraction over password hashing so it can be swapped/mocked in tests.</summary>
public interface IPasswordHasher
{
    string Hash(string plainPassword);
    bool Verify(string plainPassword, string hashedPassword);
}
