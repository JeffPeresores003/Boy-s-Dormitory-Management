// Skeleton loading for dashboard stats and charts
import React from 'react';

const SkeletonStatCard = () => (
  <div className="bg-slate-900/60 rounded-xl shadow-sm border border-slate-700/50 p-5 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <div className="h-4 w-24 bg-slate-700/40 rounded mb-2" />
        <div className="h-7 w-32 bg-slate-700/50 rounded mb-2" />
        <div className="h-3 w-20 bg-slate-700/30 rounded" />
      </div>
      <div className="h-10 w-10 bg-slate-700/40 rounded-xl ml-3" />
    </div>
  </div>
);

const SkeletonChart = () => (
  <div className="bg-slate-900/60 rounded-xl border border-slate-700/50 p-6 animate-pulse">
    <div className="h-40 w-full bg-slate-700/30 rounded" />
  </div>
);

const SkeletonDashboard = () => (
  <div className="space-y-6">
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/45 px-5 py-4 md:px-6">
      <div className="h-8 w-64 bg-slate-700/40 rounded mb-2 animate-pulse" />
      <div className="h-4 w-48 bg-slate-700/30 rounded animate-pulse" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => <SkeletonStatCard key={i} />)}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SkeletonChart />
      <SkeletonChart />
    </div>
  </div>
);

export default SkeletonDashboard;
