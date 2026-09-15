namespace LoanLite.Business.Documents;

public sealed class DocumentStorageOptions
{
    public const string SectionName = "DocumentStorage";

    public string RootPath { get; set; } = "App_Data/Documents";
    public long MaximumFileSizeBytes { get; set; } = 5 * 1024 * 1024;
}
