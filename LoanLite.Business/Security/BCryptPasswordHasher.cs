namespace LoanLite.Business.Security;

/// <summary>
/// BCrypt implementation. BCrypt automatically salts each hash and is deliberately
/// slow, which makes brute-force attacks expensive. Requires the BCrypt.Net-Next package.
/// </summary>
public class BCryptPasswordHasher : IPasswordHasher
{
    public string Hash(string plainPassword) =>
        BCrypt.Net.BCrypt.HashPassword(plainPassword);

    public bool Verify(string plainPassword, string hashedPassword) =>
        BCrypt.Net.BCrypt.Verify(plainPassword, hashedPassword);
}
