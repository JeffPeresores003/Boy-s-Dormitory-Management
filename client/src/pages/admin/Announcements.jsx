import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  const [form, setForm] = useState({ title: '', content: '', category: 'general' });

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await api.get('/announcements', { params: { page, limit: 10, search } });
      setAnnouncements(res.data.announcements);
      setTotalPages(res.data.totalPages);
    } catch { toast.error('Failed to load announcements'); }
  }, [page, search]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const resetForm = () => { setForm({ title: '', content: '', category: 'general' }); setEditing(null); setShowForm(false); };

  const openEdit = (a) => {
    setEditing(a);
    setForm({ title: a.title, content: a.content, category: a.category || 'general' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/announcements/${editing.id}`, form);
        toast.success('Announcement updated');
      } else {
        await api.post('/announcements', form);
        toast.success('Announcement created');
      }
      resetForm();
      fetchAnnouncements();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/announcements/${confirmModal.id}`);
      toast.success('Announcement deleted');
      setConfirmModal({ open: false, id: null });
      fetchAnnouncements();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
          + New Announcement
        </button>
      </div>

      <div className="mb-4">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search announcements..." />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit' : 'New'} Announcement</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="general">General</option>
                  <option value="important">Important</option>
                  <option value="event">Event</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows="5" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {announcements.map(a => (
          <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-gray-900">{a.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    a.category === 'important' ? 'bg-red-100 text-red-700' :
                    a.category === 'event' ? 'bg-purple-100 text-purple-700' :
                    a.category === 'maintenance' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{a.category || 'general'}</span>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-line mb-2">{a.content}</p>
                <p className="text-xs text-gray-400">Posted by {a.user?.firstName} {a.user?.lastName} on {new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 ml-4 shrink-0">
                <button onClick={() => openEdit(a)} className="text-primary-600 hover:underline text-xs">Edit</button>
                <button onClick={() => setConfirmModal({ open: true, id: a.id })} className="text-red-600 hover:underline text-xs">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">No announcements</div>
        )}
      </div>

      <div className="mt-4"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
      <ConfirmModal open={confirmModal.open} title="Delete Announcement" message="Are you sure?"
        onConfirm={handleDelete} onCancel={() => setConfirmModal({ open: false, id: null })} />
    </div>
  );
};

export default Announcements;
