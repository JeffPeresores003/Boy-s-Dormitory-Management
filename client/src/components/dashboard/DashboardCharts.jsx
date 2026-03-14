import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const DashboardCharts = ({ revenueChartData, roomPieData, stats, colors, formatCurrency }) => {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Monthly Revenue</h3>
          <p className="text-xs text-gray-400 mb-4">Total collections for the past six months</p>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueChartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `P${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} />
                <Bar dataKey="Revenue" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">No payment data available yet.</div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Room Status</h3>
          <p className="text-xs text-gray-400 mb-4">{stats.totalRooms} rooms in the system</p>
          {roomPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={roomPieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {roomPieData.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">No rooms have been added yet.</div>
          )}
        </div>
      </div>
    </>
  );
};

export default DashboardCharts;
