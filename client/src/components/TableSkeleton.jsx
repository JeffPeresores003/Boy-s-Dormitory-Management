const TableSkeleton = ({ rows = 8, columns = 6 }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={`head-${i}`} className="h-3 rounded bg-slate-300/45 animate-pulse" />
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`row-${r}`} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((__, c) => (
              <div key={`cell-${r}-${c}`} className="h-4 rounded bg-slate-300/35 animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableSkeleton;
