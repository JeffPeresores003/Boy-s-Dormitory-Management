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
      toast.success('Report downloaded');
    } catch {
      toast.error('Failed to generate report');
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map(rt => (
          <div key={rt.value}
            className={`bg-white rounded-xl shadow-sm border-2 p-5 cursor-pointer transition ${
              reportType === rt.value ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-100 hover:border-gray-200'
            }`}
            onClick={() => setReportType(rt.value)}>
            <h3 className="font-semibold text-gray-900 mb-1">{rt.label}</h3>
            <p className="text-xs text-gray-500">{rt.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Export: <span className="capitalize">{reportType}</span></h2>
        <p className="text-sm text-gray-500 mb-4">Choose a format to download the report.</p>
        <div className="flex gap-4">
          <button onClick={() => downloadReport('pdf')} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
            <FaFilePdf /> Download PDF
          </button>
          <button onClick={() => downloadReport('excel')} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
            <FaFileExcel /> Download Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
