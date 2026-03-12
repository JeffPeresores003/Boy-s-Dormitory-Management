import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  HiOutlineUserGroup, HiOutlineOfficeBuilding, HiOutlineCash,
  HiOutlineClipboardList, HiOutlineTrendingUp, HiOutlineHome,
  HiOutlineExclamationCircle, HiOutlineCheckCircle,
} from 'react-icons/hi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#16a34a', '#ef4444', '#f59e0b', '#8b5cf6', '#2563eb'];

const fmt = (n) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n);

const StatCard = ({ icon: Icon, label, value, sub, color, to }) => {
  const inner = (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color} flex-shrink-0 ml-3`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
};

const Badge = ({ status }) => {
  const map = {
    active: 'bg-green-100 text-green-700',
    archived: 'bg-gray-100 text-gray-600',
    student: 'bg-blue-100 text-blue-700',
    staff: 'bg-purple-100 text-purple-700',
    faculty: 'bg-indigo-100 text-indigo-700',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

const AdminDashboard = () => {
  const [stats, setStats]               = useState(null);
  const [revenue, setRevenue]           = useState([]);
  const [recentTenants, setRecentTenants] = useState([]);
  const [recentVisitors, setRecentVisitors] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, revRes, tenRes, visRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/analytics/monthly-revenue'),
          api.get('/dashboard/analytics/recent-tenants'),
          api.get('/dashboard/analytics/recent-visitors'),
        ]);
        setStats(statsRes.data);
        setRevenue(revRes.data);
        setRecentTenants(tenRes.data);
        setRecentVisitors(visRes.data);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <HiOutlineExclamationCircle className="w-10 h-10 text-red-400" />
        <p>Failed to load dashboard data.</p>
      </div>
    );
  }

  const roomPieData = [
    { name: 'Available', value: stats.availableRooms },
    { name: 'Full',      value: stats.fullRooms },
    { name: 'Maintenance', value: stats.maintenanceRooms },
  ].filter(d => d.value > 0);

  const tenantBarData = [
    { name: 'Students', count: stats.totalStudents },
    { name: 'Staff',    count: stats.totalStaff },
    { name: 'Faculty',  count: stats.totalFaculty },
  ];

  const revenueChartData = revenue.map(r => ({
    label: r.label,
    Revenue: parseFloat(r.revenue),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of the BISU Boy's Dormitory</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={HiOutlineUserGroup}
          label="Active Tenants"
          value={stats.totalTenants}
          sub={`of ${stats.totalCapacity} beds filled`}
          color="bg-primary-600"
          to="/admin/tenants"
        />
        <StatCard
          icon={HiOutlineHome}
          label="Occupancy Rate"
          value={`${stats.occupancyRate}%`}
          sub={`${stats.availableRooms} rooms available`}
          color={stats.occupancyRate >= 90 ? 'bg-red-500' : stats.occupancyRate >= 70 ? 'bg-yellow-500' : 'bg-green-600'}
        />
        <StatCard
          icon={HiOutlineCash}
          label="Total Collected"
          value={fmt(stats.totalCollected)}
          sub={`${stats.collectionRate}% collection rate`}
          color="bg-emerald-600"
          to="/admin/payments"
        />
        <StatCard
          icon={HiOutlineClipboardList}
          label="Today's Visitors"
          value={stats.todayVisitors}
          sub="checked in today"
          color="bg-violet-600"
          to="/admin/visitors"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={HiOutlineOfficeBuilding}
          label="Total Rooms"
          value={stats.totalRooms}
          sub={`${stats.fullRooms} full · ${stats.maintenanceRooms} under maintenance`}
          color="bg-slate-600"
          to="/admin/rooms"
        />
        <StatCard
          icon={HiOutlineExclamationCircle}
          label="Unpaid Bills"
          value={stats.pendingPayments}
          sub={`${stats.partialPayments} partially paid`}
          color="bg-red-500"
          to="/admin/payments"
        />
        <StatCard
          icon={HiOutlineTrendingUp}
          label="Outstanding Balance"
          value={fmt(stats.totalBalance)}
          sub="total amount due"
          color="bg-orange-500"
          to="/admin/payments"
        />
        <StatCard
          icon={HiOutlineCheckCircle}
          label="Total Billed"
          value={fmt(stats.totalBilled)}
          sub="across all semesters"
          color="bg-cyan-600"
          to="/admin/reports"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Monthly Revenue</h3>
          <p className="text-xs text-gray-400 mb-4">Last 6 months — total amounts collected</p>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueChartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [fmt(v), 'Revenue']} />
                <Bar dataKey="Revenue" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">No payment data yet</div>
          )}
        </div>

        {/* Room Status Donut */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Room Status</h3>
          <p className="text-xs text-gray-400 mb-4">{stats.totalRooms} rooms total</p>
          {roomPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={roomPieData}
                  cx="50%" cy="45%"
                  innerRadius={58} outerRadius={88}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {roomPieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">No rooms yet</div>
          )}
        </div>
      </div>

      {/* Tenant Breakdown + Recent Visitors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenant Types Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Tenants by Type</h3>
          <p className="text-xs text-gray-400 mb-4">{stats.totalTenants} active tenants</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={tenantBarData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={60} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                {tenantBarData.map((_, i) => (
                  <Cell key={i} fill={['#3b82f6', '#8b5cf6', '#6366f1'][i % 3]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Visitors */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-800">Recent Visitors</h3>
              <p className="text-xs text-gray-400">Latest visitor log entries</p>
            </div>
            <Link to="/admin/visitors" className="text-xs text-primary-600 hover:underline font-medium">View all →</Link>
          </div>
          {recentVisitors.length > 0 ? (
            <div className="space-y-3">
              {recentVisitors.map(v => (
                <div key={v.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">{v.visitorName}</p>
                    <p className="text-xs text-gray-400 truncate">
                      visiting {v.tenantFirstName ? `${v.tenantFirstName} ${v.tenantLastName}` : '—'} · {v.purpose}
                    </p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-xs text-gray-500">{new Date(v.timeIn).toLocaleDateString()}</p>
                    {v.timeOut
                      ? <span className="text-xs text-gray-400">checked out</span>
                      : <span className="text-xs text-green-600 font-medium">still inside</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No visitor records yet</p>
          )}
        </div>
      </div>

      {/* Recent Tenants */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Recently Added Tenants</h3>
            <p className="text-xs text-gray-400">Last 5 tenants registered</p>
          </div>
          <Link to="/admin/tenants" className="text-xs text-primary-600 hover:underline font-medium">View all →</Link>
        </div>
        {recentTenants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs text-gray-500 font-medium pb-2 pr-4">ID Number</th>
                  <th className="text-left text-xs text-gray-500 font-medium pb-2 pr-4">Name</th>
                  <th className="text-left text-xs text-gray-500 font-medium pb-2 pr-4">Type</th>
                  <th className="text-left text-xs text-gray-500 font-medium pb-2 pr-4">Room</th>
                  <th className="text-left text-xs text-gray-500 font-medium pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTenants.map(t => (
                  <tr key={t.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-4 text-gray-500 font-mono text-xs">{t.tenantNumber}</td>
                    <td className="py-2 pr-4 font-medium text-gray-800">{t.firstName} {t.lastName}</td>
                    <td className="py-2 pr-4"><Badge status={t.type} /></td>
                    <td className="py-2 pr-4 text-gray-500">{t.roomNumber || <span className="text-gray-300">—</span>}</td>
                    <td className="py-2"><Badge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">No tenants registered yet</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
