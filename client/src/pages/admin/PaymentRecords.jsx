import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import SkeletonList from '../../shared/SkeletonList';
import AdminPageHeader from '../../components/AdminPageHeader';
import ActionButton from '../../components/ActionButton';


const statusColors = {
  paid: 'bg-green-100 text-green-700',
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

const fmtCurrency = (value) => `₱${Number(value || 0).toLocaleString('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const PaymentRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  const handlePrintReceipt = (record) => {
    const receiptWindow = window.open('', '_blank', 'width=900,height=700');
    if (!receiptWindow) {
      toast.error('Pop-up blocked. Allow pop-ups to print the receipt.');
      return;
    }

    const tenantName = record.tenant ? `${record.tenant.firstName} ${record.tenant.lastName}` : '—';
    const tenantNumber = record.tenant?.tenantNumber || record.tenantId || '—';
    const receiptNumber = record.receiptNumber || '—';
    const paymentDate = fmtDate(record.paymentDate || record.archivedAt);
    const dueDate = fmtDate(record.dueDate);
    const amount = fmtCurrency(record.amount);
    const amountPaid = fmtCurrency(record.amountPaid || 0);
    const balance = record.balance !== null && record.balance !== undefined ? fmtCurrency(record.balance) : '—';
    const status = record.status ? record.status.toUpperCase() : '—';
    const paymentMethod = record.paymentMethod || '—';
    const semester = record.semester || '—';
    const description = record.description || 'Monthly Dormitory Fee';
    const printedAt = new Date().toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    receiptWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${escapeHtml(receiptNumber)}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: Arial, Helvetica, sans-serif;
              background: #f4f7fb;
              color: #0f172a;
              padding: 32px;
            }
            .receipt {
              max-width: 760px;
              margin: 0 auto;
              background: #ffffff;
              border: 1px solid #dbe3ef;
              border-radius: 18px;
              overflow: hidden;
              box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
            }
            .header {
              padding: 28px 32px;
              background: linear-gradient(135deg, #0f172a, #1d4ed8);
              color: #fff;
            }
            .header h1 {
              margin: 0 0 6px;
              font-size: 24px;
            }
            .header p {
              margin: 0;
              opacity: 0.88;
              font-size: 13px;
            }
            .body {
              padding: 28px 32px 32px;
            }
            .meta, .summary {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 14px 24px;
            }
            .section {
              margin-top: 24px;
            }
            .label {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #64748b;
              margin-bottom: 4px;
            }
            .value {
              font-size: 15px;
              font-weight: 600;
              color: #0f172a;
              word-break: break-word;
            }
            .items {
              margin-top: 16px;
              border: 1px solid #dbe3ef;
              border-radius: 14px;
              overflow: hidden;
            }
            .row {
              display: grid;
              grid-template-columns: 1.4fr 1fr;
              border-top: 1px solid #e5edf7;
            }
            .row:first-child { border-top: 0; }
            .row > div {
              padding: 14px 16px;
            }
            .row .row-label {
              font-size: 13px;
              color: #64748b;
            }
            .row .row-value {
              font-size: 14px;
              font-weight: 600;
              text-align: right;
            }
            .footer {
              margin-top: 28px;
              padding-top: 18px;
              border-top: 1px dashed #cbd5e1;
              display: flex;
              justify-content: space-between;
              gap: 16px;
              font-size: 12px;
              color: #64748b;
            }
            @media print {
              body { padding: 0; background: #fff; }
              .receipt { box-shadow: none; border-radius: 0; border: 0; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>Payment Receipt</h1>
              <p>Boy's Dormitory Management</p>
            </div>
            <div class="body">
              <div class="meta">
                <div>
                  <div class="label">Receipt No.</div>
                  <div class="value">${escapeHtml(receiptNumber)}</div>
                </div>
                <div>
                  <div class="label">Printed At</div>
                  <div class="value">${escapeHtml(printedAt)}</div>
                </div>
                <div>
                  <div class="label">Tenant</div>
                  <div class="value">${escapeHtml(tenantName)}</div>
                </div>
                <div>
                  <div class="label">Tenant No.</div>
                  <div class="value">${escapeHtml(tenantNumber)}</div>
                </div>
              </div>

              <div class="section">
                <div class="label">Payment Details</div>
                <div class="items">
                  <div class="row">
                    <div class="row-label">Description</div>
                    <div class="row-value">${escapeHtml(description)}</div>
                  </div>
                  <div class="row">
                    <div class="row-label">Semester</div>
                    <div class="row-value">${escapeHtml(semester)}</div>
                  </div>
                  <div class="row">
                    <div class="row-label">Due Date</div>
                    <div class="row-value">${escapeHtml(dueDate)}</div>
                  </div>
                  <div class="row">
                    <div class="row-label">Payment Date</div>
                    <div class="row-value">${escapeHtml(paymentDate)}</div>
                  </div>
                  <div class="row">
                    <div class="row-label">Payment Method</div>
                    <div class="row-value">${escapeHtml(paymentMethod)}</div>
                  </div>
                  <div class="row">
                    <div class="row-label">Status</div>
                    <div class="row-value">${escapeHtml(status)}</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="label">Summary</div>
                <div class="items">
                  <div class="row">
                    <div class="row-label">Amount</div>
                    <div class="row-value">${escapeHtml(amount)}</div>
                  </div>
                  <div class="row">
                    <div class="row-label">Amount Paid</div>
                    <div class="row-value">${escapeHtml(amountPaid)}</div>
                  </div>
                  <div class="row">
                    <div class="row-label">Balance</div>
                    <div class="row-value">${escapeHtml(balance)}</div>
                  </div>
                </div>
              </div>

              <div class="footer">
                <div>This receipt is system-generated and valid without a signature.</div>
                <div>Receipt No. ${escapeHtml(receiptNumber)}</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function () {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    receiptWindow.document.close();
  };

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments/records', {
        params: { page, limit: 10, search, status: statusFilter, month: monthFilter },
      });
      setRecords(res.data.payments);
      setTotalPages(res.data.totalPages);
    } catch { toast.error('Unable to load payment history.'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, monthFilter]);

  useEffect(() => {
    setLoading(true);
    fetchRecords().finally(() => setLoading(false));
  }, [fetchRecords]);

  return (
    <div>
      <AdminPageHeader
        title="Payment Records"
        subtitle="Review the complete payment history across all billing periods."
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="month" value={monthFilter} onChange={(e) => { setMonthFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900/70 text-slate-100" placeholder="Filter by month" />
        <div className="flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search payment history by tenant..." />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900/70 text-slate-100">
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <SkeletonList count={5} />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Paid</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Balance</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Payment Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Receipt No.</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.tenant?.tenantNumber || p.tenantId || '—'}</td>
                  <td className="px-4 py-3 font-medium">{p.tenant ? `${p.tenant.firstName} ${p.tenant.lastName}` : '—'}</td>
                  <td className="px-4 py-3">₱{parseFloat(p.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">₱{parseFloat(p.amountPaid || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">{p.balance !== null && p.balance !== undefined ? `₱${parseFloat(p.balance).toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3">{fmtDate(p.paymentDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">{p.receiptNumber || '—'}</td>
                  <td className="px-4 py-3">
                    <ActionButton variant="info" onClick={() => handlePrintReceipt(p)}>
                      Print Receipt
                    </ActionButton>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No payment records found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default PaymentRecords;
