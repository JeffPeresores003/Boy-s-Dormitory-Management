import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';

const statusColors = {
  paid: 'bg-green-100 text-green-700',
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const Payments = () => {
  const now = new Date();

  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showBilling, setShowBilling] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createYear, setCreateYear] = useState(now.getFullYear());
  const [createMonth, setCreateMonth] = useState(now.getMonth() + 1);
  const [creating, setCreating] = useState(false);

  // Derive billing cycle label from the current payments data
  const billingLabel = (() => {
    if (!payments.length || !payments[0].dueDate) return null;
    const d = new Date(payments[0].dueDate);
    if (isNaN(d)) return null;
    return new Date(d.getFullYear(), d.getMonth()).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
  })();

  const fetchPayments = useCallback(async () => {
    try {
      const res = await api.get('/payments', { params: { page, limit: 10, search, status: statusFilter } });
      setPayments(res.data.payments);
      setTotalPages(res.data.totalPages);
    } catch { toast.error('Unable to load payment records.'); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleCreateBatch = async () => {
    setCreating(true);
    try {
      const res = await api.post('/payments/create-batch', { year: createYear, month: createMonth });
      toast.success(`Billing cycle created successfully. ${res.data.created} payment record(s) generated.`);
      setShowCreateModal(false);
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to create the billing cycle.');
    } finally {
      setCreating(false);
    }
  };

  const handleMarkPaid = async (payment) => {
    const remaining = parseFloat(payment.amount) - parseFloat(payment.amountPaid);
    if (remaining <= 0) { toast.error('This payment has already been settled in full.'); return; }
    try {
      await api.put(`/payments/${payment.id}/record`, { amountPaid: remaining });
      toast.success('Payment recorded successfully.');
      fetchPayments();
    } catch (err) { toast.error(err.response?.data?.message || 'Unable to record the payment.'); }
  };

  const handlePrintBilling = (p) => {
    const tenantName = p.tenant ? `${p.tenant.firstName} ${p.tenant.lastName}` : '—';
    const balance = (parseFloat(p.amount) - parseFloat(p.amountPaid)).toLocaleString();
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
        .green { color: #16a34a; }
        .red { color: #dc2626; }
        .badge { padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; text-transform: capitalize;
          background: ${
            p.status === 'paid' ? '#dcfce7' : p.status === 'partial' ? '#fef9c3' : '#fee2e2'
          }; color: ${
            p.status === 'paid' ? '#15803d' : p.status === 'partial' ? '#92400e' : '#b91c1c'
          }; }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 rounded-2xl border border-slate-700/50 bg-slate-900/45 px-5 py-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Payments</h1>
          <p className="text-sm text-slate-400 mt-1">
            {billingLabel ? `Current billing cycle: ${billingLabel}` : 'No active billing cycle. Create a billing cycle to begin.'}
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm font-medium whitespace-nowrap transition-colors">
          + Create Billing Cycle
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1"><SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search payment records by tenant..." /></div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900/70 text-slate-100">
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      {/* Create Payment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900/95 border border-slate-700 rounded-xl shadow-xl max-w-sm w-full mx-4 p-6 text-slate-100">
            <h2 className="text-lg font-semibold mb-1">Create Monthly Billing Cycle</h2>
            <p className="text-xs text-slate-400 mb-4">This will generate a payment record for every active tenant. The due date will automatically be set to the last day of the selected month.</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select value={createMonth} onChange={e => setCreateMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select value={createYear} onChange={e => setCreateYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-slate-200 bg-slate-800 rounded-lg hover:bg-slate-700">Cancel</button>
              <button onClick={handleCreateBatch} disabled={creating}
                className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Cycle'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                <span className="text-gray-500">Description</span>
                <span>{showBilling.description || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Due Date</span>
                <span>{showBilling.dueDate}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Total Amount</span>
                <span className="font-medium">₱{parseFloat(showBilling.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Receipt Number</span>
                <span className="font-mono text-xs">{showBilling.receiptNumber || '—'}</span>
              </div>
              {showBilling.paymentDate && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Payment Date</span>
                  <span>{showBilling.paymentDate}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center mt-5">
              <button onClick={() => handlePrintBilling(showBilling)}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                Print Statement
              </button>
              <button onClick={() => setShowBilling(null)} className="px-4 py-2 text-sm text-slate-200 bg-slate-800 rounded-lg hover:bg-slate-700">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tenant</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Due Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.tenant ? `${p.tenant.firstName} ${p.tenant.lastName}` : '—'}</td>
                <td className="px-4 py-3">₱{parseFloat(p.amount).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[p.status]}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">{p.dueDate}</td>
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
            {payments.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No payment records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default Payments;
