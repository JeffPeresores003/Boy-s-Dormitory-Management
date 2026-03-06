import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';

const statusColors = {
  paid: 'bg-green-100 text-green-700',
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(null);
  const [recordAmount, setRecordAmount] = useState('');
  const [tenants, setTenants] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  const [form, setForm] = useState({ tenantId: '', amount: '', dueDate: '', semester: '', description: '' });

  const fetchPayments = useCallback(async () => {
    try {
      const res = await api.get('/payments', { params: { page, limit: 10, search, status: statusFilter } });
      setPayments(res.data.payments);
      setTotalPages(res.data.totalPages);
    } catch { toast.error('Failed to load payments'); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const fetchTenants = async () => {
    try {
      const res = await api.get('/tenants', { params: { limit: 200, status: 'active' } });
      setTenants(res.data.tenants);
    } catch { /* ignore */ }
  };

  const openCreate = () => {
    fetchTenants();
    setForm({ tenantId: '', amount: '', dueDate: '', semester: '', description: 'Monthly Dormitory Fee' });
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', { ...form, tenantId: parseInt(form.tenantId), amount: parseFloat(form.amount) });
      toast.success('Payment created');
      setShowForm(false);
      fetchPayments();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleRecordPayment = async () => {
    if (!recordAmount || parseFloat(recordAmount) <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      await api.put(`/payments/${showRecordForm.id}/record`, { amountPaid: parseFloat(recordAmount) });
      toast.success('Payment recorded');
      setShowRecordForm(null);
      setRecordAmount('');
      fetchPayments();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/payments/${confirmModal.id}`);
      toast.success('Payment deleted');
      setConfirmModal({ open: false, id: null });
      fetchPayments();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">+ Create Payment</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1"><SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by tenant name..." /></div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">Create Payment</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant *</label>
                <select value={form.tenantId} onChange={(e) => setForm({...form, tenantId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required>
                  <option value="">Select tenant</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.tenantNumber})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₱) *</label>
                  <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({...form, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                <input value={form.semester} onChange={(e) => setForm({...form, semester: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. 1st Sem 2025-2026" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecordForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-2">Record Payment</h2>
            <p className="text-sm text-gray-500 mb-4">
              Balance: ₱{(parseFloat(showRecordForm.amount) - parseFloat(showRecordForm.amountPaid)).toLocaleString()}
            </p>
            <input type="number" min="0.01" step="0.01" value={recordAmount} onChange={(e) => setRecordAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4" placeholder="Amount to record" />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowRecordForm(null); setRecordAmount(''); }} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleRecordPayment} className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700">Record</button>
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
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Paid</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Balance</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Semester</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Due Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.tenant ? `${p.tenant.firstName} ${p.tenant.lastName}` : '—'}</td>
                <td className="px-4 py-3">₱{parseFloat(p.amount).toLocaleString()}</td>
                <td className="px-4 py-3 hidden md:table-cell">₱{parseFloat(p.amountPaid).toLocaleString()}</td>
                <td className="px-4 py-3 hidden md:table-cell">₱{(parseFloat(p.amount) - parseFloat(p.amountPaid)).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[p.status]}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">{p.semester}</td>
                <td className="px-4 py-3 hidden lg:table-cell">{p.dueDate}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {p.status !== 'paid' && (
                      <button onClick={() => setShowRecordForm(p)} className="text-green-600 hover:underline text-xs">Pay</button>
                    )}
                    <button onClick={() => setConfirmModal({ open: true, id: p.id })} className="text-red-600 hover:underline text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No payments found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <ConfirmModal open={confirmModal.open} title="Delete Payment" message="Are you sure you want to delete this payment record?"
        onConfirm={handleDelete} onCancel={() => setConfirmModal({ open: false, id: null })} />
    </div>
  );
};

export default Payments;
