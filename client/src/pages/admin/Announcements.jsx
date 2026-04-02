import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import AdminPageHeader from '../../components/AdminPageHeader';
import ActionButton from '../../components/ActionButton';
import SectionLoader from '../../components/SectionLoader';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null });
  const [form, setForm] = useState({ title: '', content: '', category: 'general' });

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements', { params: { page, limit: 10, search, category: categoryFilter } });
      setAnnouncements(res.data.announcements);
      setTotalPages(res.data.totalPages);
    } catch { toast.error('Unable to load announcements.'); }
    finally { setLoading(false); }
  }, [page, search, categoryFilter]);

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

  const handleArchive = async () => {
    try {
      await api.put(`/announcements/${confirmModal.id}`, { category: 'archived' });
      toast.success('Announcement archived successfully.');
      setConfirmModal({ open: false, id: null });
      fetchAnnouncements();
    } catch { toast.error('Unable to archive the announcement.'); }
  };

  return (
    <div>
      <AdminPageHeader
        title="Announcements"
        subtitle="Share official updates with tenants and staff."
        actions={
          <ActionButton variant="success" onClick={() => { resetForm(); setShowForm(true); }}>
            + Create Announcement
          </ActionButton>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search announcements..." />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900/70 text-slate-100"
        >
          <option value="">All Categories</option>
          <option value="general">General</option>
          <option value="important">Important</option>
          <option value="event">Event</option>
          <option value="maintenance">Maintenance</option>
          <option value="archived">Archived</option>
        </select>
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
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows="5" />
              </div>
              <div className="flex justify-end gap-3">
                <ActionButton type="button" variant="neutral" onClick={resetForm}>Cancel</ActionButton>
                <ActionButton type="submit">{editing ? 'Save Changes' : 'Publish Announcement'}</ActionButton>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <SectionLoader title="Loading Announcements" subtitle="Preparing the latest published updates." />
        ) : (
          <>
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
                        a.category === 'archived' ? 'bg-gray-100 text-gray-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{a.category || 'general'}</span>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-line mb-2">{a.content}</p>
                    <p className="text-xs text-gray-400">Posted by {a.user?.firstName} {a.user?.lastName} on {new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0">
                    <button onClick={() => openEdit(a)} className="px-2 py-1 text-xs font-medium text-blue-200 bg-blue-500/15 rounded border border-blue-400/30 hover:bg-blue-500/25">Edit</button>
                    {a.category !== 'archived' && (
                      <button onClick={() => setConfirmModal({ open: true, id: a.id })} className="text-yellow-600 hover:underline text-xs">Archive</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">No announcements are available.</div>
            )}
          </>
        )}
      </div>

      <div className="mt-4"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
      <ConfirmModal open={confirmModal.open} title="Archive Announcement" message="Are you sure you want to archive this announcement?"
        onConfirm={handleArchive} onCancel={() => setConfirmModal({ open: false, id: null })} />
    </div>
  );
};

export default Announcements;
