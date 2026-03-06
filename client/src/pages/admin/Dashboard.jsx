import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  HiOutlineUserGroup, HiOutlineOfficeBuilding, HiOutlineCash,
  HiOutlineCog, HiOutlineClipboardList,
} from 'react-icons/hi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#eab308', '#ef4444', '#8b5cf6'];

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>;
  }

  if (!stats) return <p className="text-center text-gray-500">Failed to load dashboard</p>;

  const roomData = [
    { name: 'Available', value: stats.availableRooms },
    { name: 'Full', value: stats.fullRooms },
    { name: 'Maintenance', value: stats.maintenanceRooms },
  ];

  const tenantData = [
    { name: 'Students', value: stats.totalStudents },
    { name: 'Staff', value: stats.totalStaff },
    { name: 'Faculty', value: stats.totalFaculty },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={HiOutlineUserGroup} label="Total Tenants" value={stats.totalTenants} color="bg-primary-600" />
        <StatCard icon={HiOutlineOfficeBuilding} label="Available Rooms" value={stats.availableRooms} color="bg-green-600" />
        <StatCard icon={HiOutlineCash} label="Pending Payments" value={stats.pendingPayments} color="bg-yellow-500" />
        <StatCard icon={HiOutlineCog} label="Active Requests" value={stats.activeRequests} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard icon={HiOutlineOfficeBuilding} label="Total Rooms" value={stats.totalRooms} color="bg-indigo-600" />
        <StatCard icon={HiOutlineCash} label="Partial Payments" value={stats.partialPayments} color="bg-orange-500" />
        <StatCard icon={HiOutlineClipboardList} label="Today's Visitors" value={stats.todayVisitors} color="bg-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Room Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={roomData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {roomData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tenants by Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tenantData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
