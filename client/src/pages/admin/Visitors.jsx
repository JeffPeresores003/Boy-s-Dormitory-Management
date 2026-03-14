import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import SkeletonList from '../../shared/SkeletonList';
import AdminPageHeader from '../../components/AdminPageHeader';
import ActionButton from '../../components/ActionButton';

const Visitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  const [form, setForm] = useState({ visitorName: '', tenantVisitedId: '', purpose: '' });
 

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/visitors', { params: { page, limit: 10, search, date: dateFilter } });
      setVisitors(res.data.visitors);
      setTotalPages(res.data.totalPages);
    } catch { toast.error('Unable to load visitor records.'); }
    finally { setLoading(false); }
  }, [page, search, dateFilter]);

  useEffect(() => {
    setLoading(true);
    fetchVisitors().finally(() => setLoading(false));
  }, [fetchVisitors]);

  const openCreate = async () => {
    try {
      const res = await api.get('/tenants', { params: { limit: 200, status: 'active' } });
      setTenants(res.data.tenants);
    } catch { /* ignore */ }
    setForm({ visitorName: '', tenantVisitedId: '', purpose: '' });
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/visitors', { ...form, tenantVisitedId: parseInt(form.tenantVisitedId) });
      toast.success('Visitor entry created successfully.');
      setShowForm(false);
      fetchVisitors();
    } catch (err) { toast.error(err.response?.data?.message || 'Unable to save the visitor entry.'); }
  };

  const handleCheckout = async (id) => {
    try {
      await api.put(`/visitors/${id}/checkout`);
      toast.success('Visitor checked out successfully.');
      fetchVisitors();
    } catch (err) { toast.error(err.response?.data?.message || 'Unable to complete checkout.'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/visitors/${confirmModal.id}`);
      toast.success('Visitor record deleted successfully.');
      setConfirmModal({ open: false, id: null });
      fetchVisitors();
    } catch { toast.error('Unable to delete the visitor record.'); }
  };

  const formatTime = (dt) => dt ? new Date(dt).toLocaleString() : '—';

  return (
    <div>
      <AdminPageHeader
        title="Visitor Log"
        subtitle="Monitor visitor check-in and check-out activity."
        actions={<ActionButton variant="success" onClick={openCreate}>+ Add Visitor Entry</ActionButton>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1"><SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search visitor records..." /></div>
        <input type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900/70 text-slate-100" />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900/95 border border-slate-700 rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 text-slate-100">
            <h2 className="text-lg font-semibold mb-4">Record Visitor Entry</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Name *</label>
                <input value={form.visitorName} onChange={(e) => setForm({...form, visitorName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant to Visit *</label>
                <select value={form.tenantVisitedId} onChange={(e) => setForm({...form, tenantVisitedId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required>
                  <option value="">Select tenant</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Visit *</label>
                <input value={form.purpose} onChange={(e) => setForm({...form, purpose: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div className="flex justify-end gap-3">
                <ActionButton type="button" variant="neutral" onClick={() => setShowForm(false)}>Cancel</ActionButton>
                <ActionButton type="submit">Save Entry</ActionButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <SkeletonList count={5} />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Visitor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tenant Visited</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Purpose</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Check-in</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Check-out</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visitors.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{v.visitorName}</td>
                  <td className="px-4 py-3">{v.tenantVisited ? `${v.tenantVisited.firstName} ${v.tenantVisited.lastName}` : '—'}</td>
                  <td className="px-4 py-3">{v.purpose}</td>
                  <td className="px-4 py-3">{formatTime(v.timeIn)}</td>
                  <td className="px-4 py-3">{formatTime(v.timeOut)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {!v.timeOut && (
                        <button onClick={() => handleCheckout(v.id)} className="px-2 py-1 text-xs font-medium text-emerald-200 bg-emerald-500/15 rounded border border-emerald-400/30 hover:bg-emerald-500/25">Checkout</button>
                      )}
                      <button onClick={() => setConfirmModal({ open: true, id: v.id })} className="px-2 py-1 text-xs font-medium text-red-200 bg-red-500/15 rounded border border-red-400/30 hover:bg-red-500/25">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {visitors.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No visitor records found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <ConfirmModal open={confirmModal.open} title="Delete Visitor Record" message="Are you sure you want to delete this visitor record?"
        onConfirm={handleDelete} onCancel={() => setConfirmModal({ open: false, id: null })} />
    </div>
  );
};

export default Visitors;
