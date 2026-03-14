import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import AdminPageHeader from '../../components/AdminPageHeader';
import ActionButton from '../../components/ActionButton';
import SectionLoader from '../../components/SectionLoader';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
};

const Maintenance = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingReq, setEditingReq] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/maintenance', { params: { page, limit: 10, search, status: statusFilter } });
      setRequests(res.data.requests);
      setTotalPages(res.data.totalPages);
    } catch { toast.error('Unable to load maintenance requests.'); }
    finally { setLoading(false); }
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
      toast.success('Maintenance request updated successfully.');
      setEditingReq(null);
      fetchRequests();
    } catch (err) { toast.error(err.response?.data?.message || 'Unable to update the maintenance request.'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/maintenance/${confirmModal.id}`);
      toast.success('Maintenance request deleted successfully.');
      setConfirmModal({ open: false, id: null });
      fetchRequests();
    } catch { toast.error('Unable to delete the maintenance request.'); }
  };

  return (
    <div>
      <AdminPageHeader
        title="Maintenance Requests"
        subtitle="Track, review, and resolve room maintenance concerns."
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1"><SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search maintenance requests..." /></div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900/70 text-slate-100">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Edit Modal */}
      {editingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900/95 border border-slate-700 rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 text-slate-100">
            <h2 className="text-lg font-semibold mb-2">Update Maintenance Request</h2>
            <p className="text-sm text-slate-300 mb-1"><strong>Title:</strong> {editingReq.title}</p>
            <p className="text-sm text-slate-300 mb-1"><strong>Description:</strong> {editingReq.description}</p>
            <p className="text-sm text-slate-300 mb-4"><strong>Requested by:</strong> {editingReq.tenant?.firstName} {editingReq.tenant?.lastName} | <strong>Room:</strong> {editingReq.room?.roomNumber}</p>
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
                <ActionButton variant="neutral" onClick={() => setEditingReq(null)}>Cancel</ActionButton>
                <ActionButton onClick={handleUpdate}>Save Changes</ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <SectionLoader title="Loading Maintenance Requests" subtitle="Fetching pending, in-progress, and resolved tickets." />
      ) : (
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
                      <button onClick={() => openEdit(r)} className="px-2 py-1 text-xs font-medium text-blue-200 bg-blue-500/15 rounded border border-blue-400/30 hover:bg-blue-500/25">Review</button>
                      <button onClick={() => setConfirmModal({ open: true, id: r.id })} className="text-red-600 hover:underline text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No maintenance requests found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <ConfirmModal open={confirmModal.open} title="Delete Maintenance Request" message="Are you sure you want to delete this maintenance request?"
        onConfirm={handleDelete} onCancel={() => setConfirmModal({ open: false, id: null })} />
    </div>
  );
};

export default Maintenance;
