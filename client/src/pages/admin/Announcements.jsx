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
    } catch { toast.error('Unable to load announcements.'); }
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
        toast.success('Announcement updated successfully.');
      } else {
        await api.post('/announcements', form);
        toast.success('Announcement published successfully.');
      }
      resetForm();
      fetchAnnouncements();
    } catch (err) { toast.error(err.response?.data?.message || 'Unable to save the announcement.'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/announcements/${confirmModal.id}`);
      toast.success('Announcement deleted successfully.');
      setConfirmModal({ open: false, id: null });
      fetchAnnouncements();
    } catch { toast.error('Unable to delete the announcement.'); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 rounded-2xl border border-slate-700/50 bg-slate-900/45 px-5 py-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Announcements</h1>
          <p className="text-sm text-slate-400">Share official updates with tenants and staff.</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors">
          + Create Announcement
        </button>
      </div>

      <div className="mb-4">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search announcements..." />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900/95 border border-slate-700 rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 text-slate-100">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Announcement' : 'Create Announcement'}</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows="5" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-slate-200 bg-slate-800 rounded-lg hover:bg-slate-700">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700">{editing ? 'Save Changes' : 'Publish Announcement'}</button>
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
                <button onClick={() => openEdit(a)} className="px-2 py-1 text-xs font-medium text-blue-200 bg-blue-500/15 rounded border border-blue-400/30 hover:bg-blue-500/25">Edit</button>
                <button onClick={() => setConfirmModal({ open: true, id: a.id })} className="text-red-600 hover:underline text-xs">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">No announcements are available.</div>
        )}
      </div>

      <div className="mt-4"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
      <ConfirmModal open={confirmModal.open} title="Delete Announcement" message="Are you sure you want to delete this announcement?"
        onConfirm={handleDelete} onCancel={() => setConfirmModal({ open: false, id: null })} />
    </div>
  );
};

export default Announcements;
