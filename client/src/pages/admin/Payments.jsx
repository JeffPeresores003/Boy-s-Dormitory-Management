import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import AdminPageHeader from '../../components/AdminPageHeader';
import toast from 'react-hot-toast';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import SkeletonList from '../../shared/SkeletonList';
import ActionButton from '../../components/ActionButton';

const statusColors = {
  paid: 'bg-green-100 text-green-700',
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showBilling, setShowBilling] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openingCreateModal, setOpeningCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    tenantId: '',
    amount: '',
    dueDate: '',
    semester: '',
    description: 'Monthly Dormitory Fee',
    paymentMethod: 'cash',
  });
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [recordModal, setRecordModal] = useState({
    open: false,
    payment: null,
    amountPaid: '',
    receiptNumber: '',
  });
  const [recordingPayment, setRecordingPayment] = useState(false);


  // Derive billing cycle label from the current payments data
  const billingLabel = (() => {
    if (!payments.length || !payments[0].dueDate) return null;
    const d = new Date(payments[0].dueDate);
    if (isNaN(d)) return null;
    return new Date(d.getFullYear(), d.getMonth()).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
  })();

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments', { params: { page, limit: 10, search, status: statusFilter } });
      setPayments(res.data.payments);
      setTotalPages(res.data.totalPages);
    } catch { toast.error('Unable to load payment records.'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchPayments().finally(() => setLoading(false));
  }, [fetchPayments]);

  const fetchTenantOptions = useCallback(async () => {
    try {
      const res = await api.get('/payments/tenants/options', {
        params: { excludeWithExistingBilling: true },
      });
      setTenants(res.data.tenants || []);
    } catch {
      toast.error('Unable to load active tenants for payment creation.');
    }
  }, []);

  const handleOpenCreateModal = async () => {
    if (openingCreateModal) return;

    setOpeningCreateModal(true);
    try {
      await fetchTenantOptions();
      setShowCreateModal(true);
    } finally {
      setOpeningCreateModal(false);
    }
  };

  const handleTenantChangeInCreate = (tenantId) => {
    const selectedTenant = tenants.find((t) => t.id === Number(tenantId));
    setCreateForm((prev) => ({
      ...prev,
      tenantId,
      amount: selectedTenant?.amount ? String(selectedTenant.amount) : '',
      semester: selectedTenant?.duration || prev.semester,
    }));
  };

  const handleCreatePayment = async () => {
    if (!createForm.tenantId || !createForm.dueDate) {
      toast.error('Tenant and due date are required.');
      return;
    }

    setCreatingPayment(true);
    try {
      const payload = {
        tenantId: Number(createForm.tenantId),
        amount: createForm.amount !== '' ? parseFloat(createForm.amount) : undefined,
        dueDate: createForm.dueDate,
        semester: createForm.semester,
        description: createForm.description,
        paymentMethod: createForm.paymentMethod,
      };

      await api.post('/payments', payload);
      toast.success('Billing created successfully.');
      setShowCreateModal(false);
      setCreateForm({
        tenantId: '',
        amount: '',
        dueDate: '',
        semester: '',
        description: 'Monthly Dormitory Fee',
        paymentMethod: 'cash',
      });
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to create payment.');
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleOpenRecordModal = (payment) => {
    const remaining = parseFloat(payment.amount) - parseFloat(payment.amountPaid);
    if (remaining <= 0) { toast.error('This payment has already been settled in full.'); return; }

    setRecordModal({
      open: true,
      payment,
      amountPaid: remaining.toFixed(2),
      receiptNumber: payment.receiptNumber || '',
    });
  };

  const handleSubmitRecordPayment = async () => {
    if (!recordModal.payment) return;
    const typedAmount = parseFloat(recordModal.amountPaid);
    if (!typedAmount || typedAmount <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }

    const remaining = parseFloat(recordModal.payment.amount) - parseFloat(recordModal.payment.amountPaid);
    if (typedAmount > remaining) {
      toast.error('Amount paid cannot be greater than the remaining balance.');
      return;
    }

    setRecordingPayment(true);
    try {
      await api.put(`/payments/${recordModal.payment.id}/record`, {
        amountPaid: typedAmount,
        receiptNumber: recordModal.receiptNumber,
      });
      toast.success('Payment recorded successfully.');
      setRecordModal({ open: false, payment: null, amountPaid: '', receiptNumber: '' });
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to record the payment.');
    } finally {
      setRecordingPayment(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Billings"
        subtitle={billingLabel ? `Current billing cycle: ${billingLabel}` : 'No active billing cycle. Create a billing cycle to begin.'}
        actions={
          <ActionButton variant="success" onClick={handleOpenCreateModal} disabled={openingCreateModal}>
            {openingCreateModal ? 'Loading...' : '+ Create Billing'}
          </ActionButton>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1"><SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search payment records by tenant..." /></div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900/70 text-slate-100">
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      {/* Create Payment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900/95 border border-slate-700 rounded-xl shadow-xl max-w-md w-full mx-4 p-6 text-slate-100">
            <h2 className="text-lg font-semibold mb-1">Create Billing</h2>
            <p className="text-xs text-slate-400 mb-4">Create a billing record using tenant defaults from the Tenants table (amount and duration).</p>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant *</label>
                <select
                  value={createForm.tenantId}
                  onChange={(e) => handleTenantChangeInCreate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select tenant</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tenantNumber} - {t.lastName}, {t.firstName} ({t.duration || 'No duration'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={createForm.amount}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration / Semester</label>
                  <input
                    value={createForm.semester}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, semester: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="1 sem or 2 sem"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={createForm.paymentMethod}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="cash">Cash</option>
                    <option value="gcash">GCash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="scholarship">Scholarship</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <ActionButton variant="neutral" onClick={() => setShowCreateModal(false)}>Cancel</ActionButton>
              <ActionButton onClick={handleCreatePayment} disabled={creatingPayment}>
                {creatingPayment ? 'Creating...' : 'Create Billing'}
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {recordModal.open && recordModal.payment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900/95 border border-slate-700 rounded-xl shadow-xl max-w-md w-full mx-4 p-6 text-slate-100">
            <h2 className="text-lg font-semibold mb-1">Record Payment</h2>
            <p className="text-xs text-slate-400 mb-4">
              {recordModal.payment.tenant ? `${recordModal.payment.tenant.firstName} ${recordModal.payment.tenant.lastName}` : 'Tenant'}
            </p>
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Total Amount</span>
                  <span>₱{parseFloat(recordModal.payment.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300 mt-1">
                  <span>Already Paid</span>
                  <span>₱{parseFloat(recordModal.payment.amountPaid).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-300 mt-1 font-medium">
                  <span>Remaining Balance</span>
                  <span>₱{(parseFloat(recordModal.payment.amount) - parseFloat(recordModal.payment.amountPaid)).toLocaleString()}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={recordModal.amountPaid}
                  onChange={(e) => setRecordModal((prev) => ({ ...prev, amountPaid: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Number</label>
                <input
                  value={recordModal.receiptNumber}
                  onChange={(e) => setRecordModal((prev) => ({ ...prev, receiptNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Type receipt number"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <ActionButton variant="neutral" onClick={() => setRecordModal({ open: false, payment: null, amountPaid: '', receiptNumber: '' })}>
                Cancel
              </ActionButton>
              <ActionButton onClick={handleSubmitRecordPayment} disabled={recordingPayment}>
                {recordingPayment ? 'Saving...' : 'Save Payment'}
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Billing Modal */}
      {showBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900/95 border border-slate-700 rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Billing Details</h2>
              <button onClick={() => setShowBilling(null)} className="text-slate-400 hover:text-slate-200 text-xl leading-none">&times;</button>
            </div>

            <h3 className="text-sm font-semibold text-slate-200 mb-2">Payment Information</h3>
            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Tenant</span>
                <span className="font-medium">{showBilling.tenant ? `${showBilling.tenant.firstName} ${showBilling.tenant.lastName}` : '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Duration</span>
                <span>{showBilling.tenant?.duration || showBilling.semester || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Due Date</span>
                <span>{showBilling.dueDate}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Total Amount</span>
                <span className="font-medium">₱{parseFloat(showBilling.amount).toLocaleString()}</span>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-slate-200 mb-2">Tenant Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                <p className="text-xs text-slate-400">Tenant Number</p>
                <p className="font-medium">{showBilling.tenant?.tenantNumber || '—'}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                <p className="text-xs text-slate-400">Type</p>
                <p className="font-medium capitalize">{showBilling.tenant?.type || '—'}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                <p className="text-xs text-slate-400">Duration</p>
                <p className="font-medium">{showBilling.tenant?.duration || '—'}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                <p className="text-xs text-slate-400">Tenant Amount</p>
                <p className="font-medium">{showBilling.tenant?.amount ? `₱${parseFloat(showBilling.tenant.amount).toLocaleString()}` : '—'}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                <p className="text-xs text-slate-400">Email</p>
                <p className="font-medium break-all">{showBilling.tenant?.email || '—'}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                <p className="text-xs text-slate-400">Contact</p>
                <p className="font-medium">{showBilling.tenant?.contact || '—'}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                <p className="text-xs text-slate-400">Department</p>
                <p className="font-medium">{showBilling.tenant?.department || '—'}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                <p className="text-xs text-slate-400">Tenant Status</p>
                <p className="font-medium capitalize">{showBilling.tenant?.status || '—'}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                <p className="text-xs text-slate-400">Current Room ID</p>
                <p className="font-medium">{showBilling.tenant?.roomId || '—'}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                <p className="text-xs text-slate-400">Last Room Number</p>
                <p className="font-medium">{showBilling.tenant?.lastRoomNumber || '—'}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                <p className="text-xs text-slate-400">Guardian Name</p>
                <p className="font-medium">{showBilling.tenant?.guardianName || '—'}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                <p className="text-xs text-slate-400">Guardian Contact</p>
                <p className="font-medium">{showBilling.tenant?.guardianContact || '—'}</p>
              </div>
              <div className="sm:col-span-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                <p className="text-xs text-slate-400">Remarks</p>
                <p className="font-medium capitalize">{showBilling.tenant?.remarks || '—'}</p>
              </div>
            </div>

            <div className="flex justify-end items-center mt-5">
              <ActionButton variant="neutral" onClick={() => setShowBilling(null)}>Close</ActionButton>
            </div>
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Duration</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Balance</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Due Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.tenant?.tenantNumber || '—'}</td>
                  <td className="px-4 py-3">{p.tenant ? `${p.tenant.firstName} ${p.tenant.lastName}` : '—'}</td>
                  <td className="px-4 py-3">{p.tenant?.duration || p.semester || '—'}</td>
                  <td className="px-4 py-3">₱{parseFloat(p.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">₱{Math.max(0, parseFloat(p.amount || 0) - parseFloat(p.amountPaid || 0)).toLocaleString()}</td>
                  <td className="px-4 py-3">{p.dueDate}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setShowBilling(p)} className="px-2 py-1 text-xs font-medium text-blue-200 bg-blue-500/15 rounded border border-blue-400/30 hover:bg-blue-500/25">View Details</button>
                      {p.status !== 'paid' && (
                        <button onClick={() => handleOpenRecordModal(p)} className="px-2 py-1 text-xs font-medium text-emerald-200 bg-emerald-500/15 rounded border border-emerald-400/30 hover:bg-emerald-500/25">Record Payment</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No payment records found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default Payments;
