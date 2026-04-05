import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import AdminPageHeader from '../../components/AdminPageHeader';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import SkeletonList from '../../shared/SkeletonList';

const paymentBadge = {
  paid: 'bg-green-100 text-green-700',
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
  'no-record': 'bg-gray-100 text-gray-600',
};

const remarkBadge = {
  drop: 'bg-orange-100 text-orange-700',
  graduated: 'bg-cyan-100 text-cyan-700',
};

const TenantRemarks = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [remarkFilter, setRemarkFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const fetchRemarks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tenants/remarks/list', {
        params: {
          page,
          limit: 10,
          search,
          remarks: remarkFilter,
          paymentStatus: paymentFilter,
        },
      });
      setTenants(res.data.tenants || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      toast.error('Unable to load dropped and graduated tenants.');
    } finally {
      setLoading(false);
    }
  }, [page, search, remarkFilter, paymentFilter]);

  useEffect(() => {
    fetchRemarks();
  }, [fetchRemarks]);

  return (
    <div>
      <AdminPageHeader
        title="Dropped/Graduated Tenants"
        subtitle="Track exited tenants and monitor their latest payment status."
      />

      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by name, email, or tenant number..."
          />
        </div>
        <select
          value={remarkFilter}
          onChange={(e) => {
            setRemarkFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900/70 text-slate-100"
        >
          <option value="">All Remarks</option>
          <option value="drop">Drop</option>
          <option value="graduated">Graduated</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900/70 text-slate-100"
        >
          <option value="">All Payment Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="no-record">No Record</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <SkeletonList count={6} />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tenant No.</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Remarks</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Payment Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Latest Due Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Room</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.tenantNumber}</td>
                  <td className="px-4 py-3 font-medium">{t.firstName} {t.lastName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${remarkBadge[t.remarks] || 'bg-gray-100 text-gray-600'}`}>
                      {t.remarks || 'none'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${paymentBadge[t.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
                      {t.paymentStatus || 'no-record'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">{t.latestDueDate || '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">{t.room?.roomNumber || '—'}</td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No dropped or graduated tenants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default TenantRemarks;
