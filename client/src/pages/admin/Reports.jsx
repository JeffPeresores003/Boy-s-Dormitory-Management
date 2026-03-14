import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';

const Reports = () => {
  const [reportType, setReportType] = useState('tenants');
  const [loading, setLoading] = useState(false);

  const downloadReport = async (format) => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard/reports/${reportType}`, {
        params: { format },
        responseType: 'blob',
      });
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const blob = new Blob([res.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully.');
    } catch {
      toast.error('Unable to generate the report.');
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { value: 'tenants', label: 'Tenants Report', desc: 'List of all tenants with room assignment, type, and contact info.' },
    { value: 'rooms', label: 'Rooms Report', desc: 'Room inventory with occupancy count, capacity, availability, and current residents.' },
    { value: 'payments', label: 'Payments Report', desc: 'Payment transactions including amount, date, status, and tenant info.' },
    { value: 'visitors', label: 'Visitors Report', desc: 'Visitor log with check-in/out times, purpose, and tenant visited.' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6 rounded-2xl border border-slate-700/50 bg-slate-900/45 px-5 py-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Reports Center</h1>
          <p className="text-sm text-slate-400">Generate and export operational reports for the dormitory.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map(rt => (
          <div key={rt.value}
            className={`bg-white rounded-xl shadow-sm border-2 p-5 cursor-pointer transition ${
              reportType === rt.value ? 'border-primary-500 ring-2 ring-primary-500/25' : 'border-gray-100 hover:border-slate-500/50'
            }`}
            onClick={() => setReportType(rt.value)}>
            <h3 className="font-semibold text-slate-100 mb-1">{rt.label}</h3>
            <p className="text-xs text-slate-400">{rt.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-2">Export Report: <span className="capitalize">{reportType}</span></h2>
        <p className="text-sm text-slate-400 mb-4">Select a file format to download the report.</p>
        <div className="flex gap-4">
          <button onClick={() => downloadReport('pdf')} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
            <FaFilePdf /> Download PDF
          </button>
          <button onClick={() => downloadReport('excel')} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            <FaFileExcel /> Download Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
