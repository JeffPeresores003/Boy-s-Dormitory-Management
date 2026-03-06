import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
};

const Maintenance = () => {
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingReq, setEditingReq] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get('/maintenance', { params: { page, limit: 10, search, status: statusFilter } });
      setRequests(res.data.requests);
      setTotalPages(res.data.totalPages);
    } catch { toast.error('Failed to load requests'); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const openEdit = (req) => {
    setEditingReq(req);
    setEditStatus(req.status);
    setEditNotes(req.adminNotes || '');
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/maintenance/${editingReq.id}`, { status: editStatus, adminNotes: editNotes });
      toast.success('Request updated');
      setEditingReq(null);
      fetchRequests();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/maintenance/${confirmModal.id}`);
      toast.success('Request deleted');
      setConfirmModal({ open: false, id: null });
      fetchRequests();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Maintenance Requests</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1"><SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by title..." /></div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Edit Modal */}
      {editingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-2">Update Request</h2>
            <p className="text-sm text-gray-500 mb-1"><strong>Title:</strong> {editingReq.title}</p>
            <p className="text-sm text-gray-500 mb-1"><strong>Description:</strong> {editingReq.description}</p>
            <p className="text-sm text-gray-500 mb-4"><strong>By:</strong> {editingReq.tenant?.firstName} {editingReq.tenant?.lastName} | <strong>Room:</strong> {editingReq.room?.roomNumber}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows="3" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setEditingReq(null)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button onClick={handleUpdate} className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700">Update</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tenant</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Room</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{r.title}</td>
                <td className="px-4 py-3">{r.tenant ? `${r.tenant.firstName} ${r.tenant.lastName}` : '—'}</td>
                <td className="px-4 py-3 hidden md:table-cell">{r.room?.roomNumber || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[r.status]}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(r)} className="text-primary-600 hover:underline text-xs">Update</button>
                    <button onClick={() => setConfirmModal({ open: true, id: r.id })} className="text-red-600 hover:underline text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No maintenance requests</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <ConfirmModal open={confirmModal.open} title="Delete Request" message="Are you sure?"
        onConfirm={handleDelete} onCancel={() => setConfirmModal({ open: false, id: null })} />
    </div>
  );
};

export default Maintenance;
