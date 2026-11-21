using Dapper;
using System.Data;

public sealed class InvoiceRepository
{
    private readonly IDbConnection _db;
    private readonly ITenantContext _tenant;

    public InvoiceRepository(IDbConnection db, ITenantContext tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    public Task<IEnumerable<Invoice>> ListAsync() =>
        _db.QueryAsync<Invoice>(
            "SELECT id, tenant_id, number, total FROM invoices WHERE tenant_id = @TenantId",
            new { TenantId = _tenant.TenantId });

    public Task<IEnumerable<Invoice>> SearchByNumberAsync(string number) =>
        _db.QueryAsync<Invoice>(
            "SELECT id, tenant_id, number, total FROM invoices WHERE number LIKE @Pattern",
            new { Pattern = number + "%" });
}
