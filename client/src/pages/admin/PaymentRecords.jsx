import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import SkeletonList from '../../shared/SkeletonList';
import AdminPageHeader from '../../components/AdminPageHeader';


const statusColors = {
  paid: 'bg-green-100 text-green-700',
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

const PaymentRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

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
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No payment records found.</td></tr>
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
