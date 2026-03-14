import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlineCash,
  HiOutlineClipboardList,
  HiOutlineTrendingUp,
  HiOutlineHome,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import AdminPageHeader from '../../components/AdminPageHeader';
import SectionLoader from '../../components/SectionLoader';
import TenantTypeChartCard from '../../components/dashboard/TenantTypeChartCard';

const loadDashboardCharts = () => import('../../components/dashboard/DashboardCharts');
const DashboardCharts = lazy(loadDashboardCharts);

const COLORS = ['#16a34a', '#ef4444', '#f59e0b', '#8b5cf6', '#2563eb'];
const DASHBOARD_STATS_CACHE_KEY = 'admin_dashboard_stats_cache_v1';
const DASHBOARD_REVENUE_CACHE_KEY = 'admin_dashboard_revenue_cache_v1';
const DASHBOARD_TENANTS_CACHE_KEY = 'admin_dashboard_tenants_cache_v1';
const DASHBOARD_VISITORS_CACHE_KEY = 'admin_dashboard_visitors_cache_v1';

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

const fmt = (n) => currencyFormatter.format(n || 0);

const getCached = (key, fallback) => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

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
  const { user } = useAuth();

  const cachedStats = getCached(DASHBOARD_STATS_CACHE_KEY, null);
  const cachedRevenue = getCached(DASHBOARD_REVENUE_CACHE_KEY, []);
  const cachedTenants = getCached(DASHBOARD_TENANTS_CACHE_KEY, []);
  const cachedVisitors = getCached(DASHBOARD_VISITORS_CACHE_KEY, []);
  const hasCachedAnalytics =
    cachedRevenue.length > 0 || cachedTenants.length > 0 || cachedVisitors.length > 0;

  const [stats, setStats] = useState(cachedStats);
  const [revenue, setRevenue] = useState(cachedRevenue);
  const [recentTenants, setRecentTenants] = useState(cachedTenants);
  const [recentVisitors, setRecentVisitors] = useState(cachedVisitors);
  const [loadingStats, setLoadingStats] = useState(!cachedStats);
  const [analyticsLoading, setAnalyticsLoading] = useState(!hasCachedAnalytics);

  useEffect(() => {
    let active = true;

    const loadStats = async () => {
      try {
        const statsRes = await api.get('/dashboard/stats');
        if (!active) return;
        setStats(statsRes.data);
        sessionStorage.setItem(DASHBOARD_STATS_CACHE_KEY, JSON.stringify(statsRes.data));

        // Preload chart chunk so analytics section appears immediately once visible.
        loadDashboardCharts();
      } catch (err) {
        console.error('Dashboard stats load error:', err);
      } finally {
        if (!active) return;
        setLoadingStats(false);
      }
    };

    const loadAnalytics = async () => {
      if (!hasCachedAnalytics) {
        setAnalyticsLoading(true);
      }

      const [revRes, tenRes, visRes] = await Promise.allSettled([
        api.get('/dashboard/analytics/monthly-revenue'),
        api.get('/dashboard/analytics/recent-tenants'),
        api.get('/dashboard/analytics/recent-visitors'),
      ]);

      if (!active) return;

      const revenueData = revRes.status === 'fulfilled' ? revRes.value.data : [];
      const tenantsData = tenRes.status === 'fulfilled' ? tenRes.value.data : [];
      const visitorsData = visRes.status === 'fulfilled' ? visRes.value.data : [];

      setRevenue(revenueData);
      setRecentTenants(tenantsData);
      setRecentVisitors(visitorsData);

      sessionStorage.setItem(DASHBOARD_REVENUE_CACHE_KEY, JSON.stringify(revenueData));
      sessionStorage.setItem(DASHBOARD_TENANTS_CACHE_KEY, JSON.stringify(tenantsData));
      sessionStorage.setItem(DASHBOARD_VISITORS_CACHE_KEY, JSON.stringify(visitorsData));

      setAnalyticsLoading(false);
    };

    loadStats();
    loadAnalytics();

    return () => {
      active = false;
    };
  }, []);

  const roomPieData = useMemo(
    () =>
      [
        { name: 'Available', value: stats?.availableRooms || 0 },
        { name: 'Full', value: stats?.fullRooms || 0 },
        { name: 'Maintenance', value: stats?.maintenanceRooms || 0 },
      ].filter((d) => d.value > 0),
    [stats]
  );

  const tenantBarData = useMemo(
    () => [
      { name: 'Students', count: stats?.totalStudents || 0 },
      { name: 'Staff', count: stats?.totalStaff || 0 },
      { name: 'Faculty', count: stats?.totalFaculty || 0 },
    ],
    [stats]
  );

  const revenueChartData = useMemo(
    () =>
      revenue.map((r) => ({
        label: r.label,
        Revenue: parseFloat(r.revenue),
      })),
    [revenue]
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Welcome back, ${user?.name || 'Admin'}`}
        subtitle="Administrative overview for the BISU Boy's Dormitory."
        className="md:px-6"
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">Core Metrics</h2>
        </div>

        {loadingStats && !stats ? (
          <SectionLoader title="Loading Core Metrics" subtitle="Gathering occupancy, tenant, and billing indicators." />
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                icon={HiOutlineUserGroup}
                label="Active Tenants"
                value={stats.totalTenants}
                sub={`${stats.totalCapacity} total bed capacity`}
                color="bg-primary-600"
                to="/admin/tenants"
              />
              <StatCard
                icon={HiOutlineHome}
                label="Occupancy Rate"
                value={`${stats.occupancyRate}%`}
                sub={`${stats.availableRooms} rooms currently available`}
                color={
                  stats.occupancyRate >= 90
                    ? 'bg-red-500'
                    : stats.occupancyRate >= 70
                      ? 'bg-yellow-500'
                      : 'bg-green-600'
                }
              />
              <StatCard
                icon={HiOutlineCash}
                label="Total Collected"
                value={fmt(stats.totalCollected)}
                sub={`${stats.collectionRate}% collection efficiency`}
                color="bg-emerald-600"
                to="/admin/payments"
              />
              <StatCard
                icon={HiOutlineClipboardList}
                label="Today's Visitors"
                value={stats.todayVisitors}
                sub="visitor entries recorded today"
                color="bg-violet-600"
                to="/admin/visitors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                icon={HiOutlineOfficeBuilding}
                label="Total Rooms"
                value={stats.totalRooms}
                sub={`${stats.fullRooms} fully occupied · ${stats.maintenanceRooms} under maintenance`}
                color="bg-slate-600"
                to="/admin/rooms"
              />
              <StatCard
                icon={HiOutlineExclamationCircle}
                label="Unpaid Bills"
                value={stats.pendingPayments}
                sub={`${stats.partialPayments} partially settled`}
                color="bg-red-500"
                to="/admin/payments"
              />
              <StatCard
                icon={HiOutlineTrendingUp}
                label="Outstanding Balance"
                value={fmt(stats.totalBalance)}
                sub="total outstanding balance"
                color="bg-orange-500"
                to="/admin/payments"
              />
              <StatCard
                icon={HiOutlineCheckCircle}
                label="Total Billed"
                value={fmt(stats.totalBilled)}
                sub="across all billing periods"
                color="bg-cyan-600"
                to="/admin/reports"
              />
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center text-slate-500">
            Unable to load dashboard metrics at this time.
          </div>
        )}
      </section>

      {stats && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">Operational Analytics</h2>
          </div>

          <Suspense fallback={<SectionLoader title="Loading Analytics" subtitle="Preparing chart visualizations and trends." />}>
            <DashboardCharts
              revenueChartData={revenueChartData}
              roomPieData={roomPieData}
              stats={stats}
              colors={COLORS}
              formatCurrency={fmt}
            />
          </Suspense>
        </section>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <TenantTypeChartCard tenantBarData={tenantBarData} totalTenants={stats?.totalTenants || 0} />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-800">Recent Visitors</h3>
              <p className="text-xs text-gray-400">Most recent visitor log entries</p>
            </div>
            <Link to="/admin/visitors" className="text-xs text-primary-600 hover:underline font-medium">
              View all
            </Link>
          </div>

          {analyticsLoading ? (
            <SectionLoader compact title="Loading Visitor Activity" subtitle="Collecting latest visitor logs." />
          ) : recentVisitors.length > 0 ? (
            <div className="space-y-3">
              {recentVisitors.map((v) => (
                <div key={v.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">{v.visitorName}</p>
                    <p className="text-xs text-gray-400 truncate">
                      Visiting {v.tenantFirstName ? `${v.tenantFirstName} ${v.tenantLastName}` : '—'} · {v.purpose}
                    </p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-xs text-gray-500">{new Date(v.timeIn).toLocaleDateString()}</p>
                    {v.timeOut ? (
                      <span className="text-xs text-gray-400">Checked out</span>
                    ) : (
                      <span className="text-xs text-green-600 font-medium">Currently on site</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No visitor activity has been recorded yet.</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-800">Recently Registered Tenants</h3>
              <p className="text-xs text-gray-400">The five most recently added tenant records</p>
            </div>
            <Link to="/admin/tenants" className="text-xs text-primary-600 hover:underline font-medium">
              View all
            </Link>
          </div>

          {analyticsLoading ? (
            <SectionLoader compact title="Loading Tenant Activity" subtitle="Retrieving most recent tenant registrations." />
          ) : recentTenants.length > 0 ? (
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
                  {recentTenants.map((t) => (
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
            <p className="text-sm text-gray-400 text-center py-6">No tenants have been registered yet.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
