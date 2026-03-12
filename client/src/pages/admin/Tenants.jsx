import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    contact: '', type: 'student', department: '', roomId: '', guardianName: '', guardianContact: '',
    payAmount: '', payDescription: 'Monthly Dormitory Fee',
  });

  const fetchTenants = useCallback(async () => {
    try {
      const res = await api.get('/tenants', { params: { page, limit: 10, search, status: statusFilter, type: typeFilter } });
      setTenants(res.data.tenants);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Failed to load tenants');
    }
  }, [page, search, statusFilter, typeFilter]);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await api.get('/rooms', { params: { limit: 100 } });
      setRooms(res.data.rooms || []);
    } catch { /* rooms will be empty */ }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);
  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const availableRooms = rooms.filter(r => r.status === 'available');

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', email: '', contact: '', type: 'student', department: '', roomId: '', guardianName: '', guardianContact: '', payAmount: '', payDescription: 'Monthly Dormitory Fee' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { payAmount, payDescription, ...tenantData } = form;
      if (editingId) {
        await api.put(`/tenants/${editingId}`, tenantData);
        toast.success('Tenant updated');
      } else {
        await api.post('/tenants', {
          ...tenantData,
          payment: { amount: payAmount, description: payDescription },
        });
        toast.success('Tenant added');
      }
      resetForm();
      fetchTenants();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (tenant) => {
    setForm({
      firstName: tenant.firstName, lastName: tenant.lastName,
      email: tenant.email, contact: tenant.contact,
      type: tenant.type, department: tenant.department || '',
      roomId: tenant.roomId || '', guardianName: tenant.guardianName || '', guardianContact: tenant.guardianContact || '',
      payAmount: '', payDueDate: '', payDescription: 'Monthly Dormitory Fee',
    });
    setEditingId(tenant.id);
    setShowForm(true);
  };

  const handleArchive = async () => {
    try {
      await api.put(`/tenants/${confirmModal.id}/archive`);
      toast.success('Tenant archived');
      setConfirmModal({ open: false, id: null });
      fetchTenants();
    } catch {
      toast.error('Archive failed');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/tenants/${deleteModal.id}`);
      toast.success('Tenant deleted');
      setDeleteModal({ open: false, id: null, name: '' });
      fetchTenants();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const typeColors = {
    student: 'bg-blue-100 text-blue-700',
    staff: 'bg-purple-100 text-purple-700',
    faculty: 'bg-indigo-100 text-indigo-700',
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
          + Add Tenant
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1"><SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search tenants..." /></div>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Types</option>
          <option value="student">Student</option>
          <option value="staff">Staff</option>
          <option value="faculty">Faculty</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Tenant' : 'Add New Tenant'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required disabled={!!editingId} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact *</label>
                <input value={form.contact} onChange={(e) => setForm({...form, contact: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input value={form.department} onChange={(e) => setForm({...form, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Room *</label>
                <select value={form.roomId} onChange={(e) => setForm({...form, roomId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required>
                  <option value="">Select a room</option>
                  {availableRooms.map(r => (
                    <option key={r.id} value={r.id}>Room {r.roomNumber} — Floor {r.floor} ({r.availabilityMessage || `Capacity: ${r.capacity}`})</option>
                  ))}
                  {editingId && form.roomId && !availableRooms.find(r => r.id === Number(form.roomId)) && (
                    <option value={form.roomId}>Current Room (id: {form.roomId})</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                <input value={form.guardianName} onChange={(e) => setForm({...form, guardianName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Contact</label>
                <input value={form.guardianContact} onChange={(e) => setForm({...form, guardianContact: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Optional" />
              </div>
              {!editingId && (
                <>
                  <div className="sm:col-span-2 border-t border-gray-200 pt-4 mt-1">
                    <h3 className="text-sm font-semibold text-gray-800 mb-1">Initial Payment Setup</h3>
                    <p className="text-xs text-gray-400">Creates a payment record automatically for this tenant.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₱) *</label>
                    <input type="number" min="0" step="0.01" value={form.payAmount} onChange={(e) => setForm({...form, payAmount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input value={form.payDescription} onChange={(e) => setForm({...form, payDescription: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </>
              )}
              <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700">{editingId ? 'Update' : 'Add Tenant'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tenant No.</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Department</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Room</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tenants.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{t.tenantNumber}</td>
                <td className="px-4 py-3 font-medium">{t.firstName} {t.lastName}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${typeColors[t.type]}`}>
                    {t.type}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">{t.department || '—'}</td>
                <td className="px-4 py-3">{t.room?.roomNumber || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(t)} className="text-primary-600 hover:underline text-xs">Edit</button>
                    {t.status === 'active' && (
                      <button onClick={() => setConfirmModal({ open: true, id: t.id })} className="text-yellow-600 hover:underline text-xs">Archive</button>
                    )}
                    <button onClick={() => setDeleteModal({ open: true, id: t.id, name: `${t.firstName} ${t.lastName}` })} className="text-red-600 hover:underline text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No tenants found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <ConfirmModal open={confirmModal.open} title="Archive Tenant" message="Are you sure you want to archive this tenant? They will be removed from their room."
        onConfirm={handleArchive} onCancel={() => setConfirmModal({ open: false, id: null })} />
      <ConfirmModal open={deleteModal.open} title="Delete Tenant"
        message={`Permanently delete ${deleteModal.name}? This will also delete all their payment records and cannot be undone.`}
        onConfirm={handleDelete} onCancel={() => setDeleteModal({ open: false, id: null, name: '' })} />
    </div>
  );
};

export default Tenants;
