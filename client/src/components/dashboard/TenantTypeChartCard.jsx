import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const TenantTypeChartCard = ({ tenantBarData, totalTenants }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-base font-semibold text-gray-800 mb-1">Tenants by Type</h3>
      <p className="text-xs text-gray-400 mb-4">{totalTenants} tenants currently active</p>
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
  );
};

export default TenantTypeChartCard;
