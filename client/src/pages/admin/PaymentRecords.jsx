import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import SkeletonList from '../../shared/SkeletonList';

const statusColors = {
  paid: 'bg-green-100 text-green-700',
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

const fmtMonth = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
};

const PaymentRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [showBilling, setShowBilling] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleMarkPaid = async (payment) => {
    const remaining = parseFloat(payment.amount) - parseFloat(payment.amountPaid);
    if (remaining <= 0) { toast.error('This payment has already been settled in full.'); return; }
    try {
      await api.put(`/payments/records/${payment.id}/record`, { amountPaid: remaining, source: payment.source });
      toast.success('Payment recorded successfully.');
      fetchRecords();
    } catch (err) { toast.error(err.response?.data?.message || 'Unable to record the payment.'); }
  };

  const handlePrintBilling = (p) => {
    const tenantName = p.tenant ? `${p.tenant.firstName} ${p.tenant.lastName}` : '—';
    const win = window.open('', '_blank', 'width=640,height=750');
    win.document.write(`
      <!DOCTYPE html><html><head><title>Billing Statement</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; padding: 40px; color: #111; font-size: 14px; }
        .header { text-align: center; margin-bottom: 28px; }
        .header h2 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
        .header p { color: #555; font-size: 13px; }
        .divider { border: none; border-top: 2px solid #111; margin: 16px 0; }
        .row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #e5e7eb; }
        .row:last-child { border-bottom: none; }
        .label { color: #6b7280; }
        .value { font-weight: 600; text-align: right; }
        .footer { margin-top: 32px; font-size: 12px; color: #9ca3af; text-align: center; }
      </style></head><body>
      <div class='header'>
        <h2>Billing Statement</h2>
        <p>BISU Boy's Dormitory</p>
      </div>
      <hr class='divider' />
      <div class='row'><span class='label'>Tenant</span><span class='value'>${tenantName}</span></div>
      <div class='row'><span class='label'>Description</span><span class='value'>${p.description || 'Monthly Dormitory Fee'}</span></div>
      <div class='row'><span class='label'>Due Date</span><span class='value'>${p.dueDate || '—'}</span></div>
      <div class='row'><span class='label'>Total Amount</span><span class='value'>₱${parseFloat(p.amount).toLocaleString()}</span></div>
      <div class='row'><span class='label'>Receipt No.</span><span class='value'>${p.receiptNumber || '—'}</span></div>
      ${p.paymentDate ? `<div class='row'><span class='label'>Payment Date</span><span class='value'>${p.paymentDate}</span></div>` : ''}
      <hr class='divider' />
      <p class='footer'>Printed on ${new Date().toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}</p>
      <script>window.onload = function(){ window.print(); }<\/script>
      </body></html>
    `);
    win.document.close();
  };

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
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      {/* Billing Modal */}
      {showBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900/95 border border-slate-700 rounded-xl shadow-xl max-w-md w-full mx-4 p-6 text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Billing Statement</h2>
              <button onClick={() => setShowBilling(null)} className="text-slate-400 hover:text-slate-200 text-xl leading-none">&times;</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Tenant</span>
                <span className="font-medium">{showBilling.tenant ? `${showBilling.tenant.firstName} ${showBilling.tenant.lastName}` : '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Month</span>
                <span>{fmtMonth(showBilling.dueDate)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Description</span>
                <span>{showBilling.description || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Due Date</span>
                <span>{fmtDate(showBilling.dueDate)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Total Amount</span>
                <span className="font-medium">₱{parseFloat(showBilling.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[showBilling.status]}`}>{showBilling.status}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Receipt No.</span>
                <span className="font-mono text-xs">{showBilling.receiptNumber || '—'}</span>
              </div>
              {showBilling.paymentDate && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Payment Date</span>
                  <span>{fmtDate(showBilling.paymentDate)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center mt-5">
              <ActionButton variant="info" onClick={() => handlePrintBilling(showBilling)}>
                Print Statement
              </ActionButton>
              <ActionButton variant="neutral" onClick={() => setShowBilling(null)}>Close</ActionButton>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <SkeletonList count={5} />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tenant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Due Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Receipt No.</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.tenant ? `${p.tenant.firstName} ${p.tenant.lastName}` : '—'}</td>
                  <td className="px-4 py-3">{p.description || 'Monthly Dormitory Fee'}</td>
                  <td className="px-4 py-3">₱{parseFloat(p.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">{p.dueDate || '—'}</td>
                  <td className="px-4 py-3">{p.receiptNumber || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setShowBilling(p)} className="px-2 py-1 text-xs font-medium text-blue-200 bg-blue-500/15 rounded border border-blue-400/30 hover:bg-blue-500/25">View Statement</button>
                      {p.status !== 'paid' && (
                        <button onClick={() => handleMarkPaid(p)} className="px-2 py-1 text-xs font-medium text-emerald-200 bg-emerald-500/15 rounded border border-emerald-400/30 hover:bg-emerald-500/25">Record Payment</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No payment records found.</td></tr>
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
