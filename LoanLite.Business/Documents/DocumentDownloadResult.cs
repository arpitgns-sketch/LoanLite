namespace LoanLite.Business.Documents;

public sealed record DocumentDownloadResult(
    string FullPath,
    string ContentType,
    string DownloadFileName);
