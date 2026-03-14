// Skeleton loading for list views with scroll-up animation
import React from 'react';

const SkeletonItem = () => (
  <div className="flex items-center gap-4 py-3 animate-skeleton-scroll">
    <div className="h-8 w-8 bg-slate-700/30 rounded-lg" />
    <div className="flex-1">
      <div className="h-4 w-32 bg-slate-700/40 rounded mb-2" />
      <div className="h-3 w-24 bg-slate-700/30 rounded" />
    </div>
    <div className="h-4 w-12 bg-slate-700/30 rounded" />
  </div>
);

const SkeletonList = ({ count = 3 }) => (
  <div className="space-y-2 flex flex-col items-center justify-center min-h-[200px]">
    {[...Array(count)].map((_, i) => <SkeletonItem key={i} />)}
  </div>
);

export default SkeletonList;
