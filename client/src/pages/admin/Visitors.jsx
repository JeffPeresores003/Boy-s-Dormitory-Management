import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';

const Visitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  const [form, setForm] = useState({ visitorName: '', tenantVisitedId: '', purpose: '' });

  const fetchVisitors = useCallback(async () => {
    try {
      const res = await api.get('/visitors', { params: { page, limit: 10, search, date: dateFilter } });
      setVisitors(res.data.visitors);
      setTotalPages(res.data.totalPages);
    } catch { toast.error('Failed to load visitors'); }
  }, [page, search, dateFilter]);

  useEffect(() => { fetchVisitors(); }, [fetchVisitors]);

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
      toast.success('Visitor logged');
      setShowForm(false);
      fetchVisitors();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleCheckout = async (id) => {
    try {
      await api.put(`/visitors/${id}/checkout`);
      toast.success('Visitor checked out');
      fetchVisitors();
    } catch (err) { toast.error(err.response?.data?.message || 'Checkout failed'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/visitors/${confirmModal.id}`);
      toast.success('Log deleted');
      setConfirmModal({ open: false, id: null });
      fetchVisitors();
    } catch { toast.error('Delete failed'); }
  };

  const formatTime = (dt) => dt ? new Date(dt).toLocaleString() : '—';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Visitor Log</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">+ Log Visitor</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1"><SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search visitor name..." /></div>
        <input type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">Log Visitor</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Name *</label>
                <input value={form.visitorName} onChange={(e) => setForm({...form, visitorName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Visited *</label>
                <select value={form.tenantVisitedId} onChange={(e) => setForm({...form, tenantVisitedId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required>
                  <option value="">Select tenant</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
                <input value={form.purpose} onChange={(e) => setForm({...form, purpose: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700">Log Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Visitor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tenant Visited</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Purpose</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Time In</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Time Out</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visitors.map(v => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{v.visitorName}</td>
                <td className="px-4 py-3">{v.tenantVisited ? `${v.tenantVisited.firstName} ${v.tenantVisited.lastName}` : '—'}</td>
                <td className="px-4 py-3 hidden md:table-cell">{v.purpose}</td>
                <td className="px-4 py-3 text-xs">{formatTime(v.timeIn)}</td>
                <td className="px-4 py-3 text-xs">{v.timeOut ? formatTime(v.timeOut) : <span className="text-yellow-600 font-medium">Still In</span>}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {!v.timeOut && <button onClick={() => handleCheckout(v.id)} className="text-green-600 hover:underline text-xs">Checkout</button>}
                    <button onClick={() => setConfirmModal({ open: true, id: v.id })} className="text-red-600 hover:underline text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {visitors.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No visitor logs found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <ConfirmModal open={confirmModal.open} title="Delete Visitor Log" message="Are you sure?"
        onConfirm={handleDelete} onCancel={() => setConfirmModal({ open: false, id: null })} />
    </div>
  );
};

export default Visitors;
