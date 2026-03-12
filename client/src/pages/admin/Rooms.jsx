import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';

const statusColors = {
  available: 'bg-green-100 text-green-700',
  full: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-red-100 text-red-700',
};

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  const [showAssign, setShowAssign] = useState(null);
  const [assignTenantId, setAssignTenantId] = useState('');
  const [unassignedTenants, setUnassignedTenants] = useState([]);
  const [form, setForm] = useState({ roomNumber: '', floor: 1, capacity: 1, description: '', status: 'available' });

  const fetchRooms = useCallback(async () => {
    try {
      const res = await api.get('/rooms', { params: { page, limit: 10, search, status: statusFilter } });
      setRooms(res.data.rooms);
      setTotalPages(res.data.totalPages);
    } catch { toast.error('Failed to load rooms'); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const resetForm = () => { setForm({ roomNumber: '', floor: 1, capacity: 1, description: '', status: 'available' }); setEditingId(null); setShowForm(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/rooms/${editingId}`, form);
        toast.success('Room updated');
      } else {
        await api.post('/rooms', form);
        toast.success('Room created');
      }
      resetForm();
      fetchRooms();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
  };

  const handleEdit = (room) => {
    setForm({ roomNumber: room.roomNumber, floor: room.floor, capacity: room.capacity, description: room.description || '', status: room.status });
    setEditingId(room.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/rooms/${confirmModal.id}`);
      toast.success('Room deleted');
      setConfirmModal({ open: false, id: null });
      fetchRooms();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const openAssign = async (room) => {
    setShowAssign(room);
    try {
      const res = await api.get('/tenants', { params: { limit: 100, status: 'active' } });
      setUnassignedTenants(res.data.tenants.filter(t => !t.roomId));
    } catch { /* ignore */ }
  };

  const handleAssign = async () => {
    if (!assignTenantId) return;
    try {
      await api.post(`/rooms/${showAssign.id}/assign`, { tenantId: parseInt(assignTenantId) });
      toast.success('Tenant assigned to room');
      setShowAssign(null);
      setAssignTenantId('');
      fetchRooms();
    } catch (err) { toast.error(err.response?.data?.message || 'Assign failed'); }
  };

  const handleRemove = async (roomId, tenantId) => {
    try {
      await api.post(`/rooms/${roomId}/remove`, { tenantId });
      toast.success('Tenant removed from room');
      fetchRooms();
    } catch (err) { toast.error(err.response?.data?.message || 'Remove failed'); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">+ Add Room</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1"><SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search room number..." /></div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="full">Full</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Room' : 'Add New Room'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Number *</label>
                  <input value={form.roomNumber} onChange={(e) => setForm({...form, roomNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor *</label>
                  <input type="number" min="1" value={form.floor} onChange={(e) => setForm({...form, floor: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                  <input type="number" min="1" value={form.capacity} onChange={(e) => setForm({...form, capacity: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                </div>
              </div>
              {editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="available">Available</option>
                    <option value="full">Full</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows="2" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700">{editingId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">Assign Tenant to Room {showAssign.roomNumber}</h2>
            <select value={assignTenantId} onChange={(e) => setAssignTenantId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4">
              <option value="">Select a tenant</option>
              {unassignedTenants.map(t => (
                <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.tenantNumber}) - {t.type}</option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowAssign(null); setAssignTenantId(''); }} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleAssign} className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700">Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Room</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Floor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Occupancy</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Availability</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Occupants</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rooms.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{r.roomNumber}</td>
                <td className="px-4 py-3">{r.floor}</td>
                <td className="px-4 py-3">{r.occupancyCount}/{r.capacity}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    r.availabilityMessage === 'Room Full' ? 'bg-red-100 text-red-700' :
                    r.availabilityMessage === 'Under Maintenance' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {r.availabilityMessage}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[r.status]}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3">
                  {r.occupants && r.occupants.length > 0 ? (
                    <div className="space-y-1">
                      {r.occupants.map(o => (
                        <div key={o.id} className="flex items-center gap-2 text-xs">
                          <span>{o.firstName} {o.lastName} <span className="text-gray-400">({o.type})</span></span>
                          <button onClick={() => handleRemove(r.id, o.id)} className="text-red-500 hover:underline">Remove</button>
                        </div>
                      ))}
                    </div>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(r)} className="text-primary-600 hover:underline text-xs">Edit</button>
                    {r.isAvailable && (
                      <button onClick={() => openAssign(r)} className="text-green-600 hover:underline text-xs">Assign</button>
                    )}
                    <button onClick={() => setConfirmModal({ open: true, id: r.id })} className="text-red-600 hover:underline text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No rooms found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <ConfirmModal open={confirmModal.open} title="Delete Room" message="Are you sure? Rooms with occupants cannot be deleted."
        onConfirm={handleDelete} onCancel={() => setConfirmModal({ open: false, id: null })} />
    </div>
  );
};

export default Rooms;
