import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 px-2 py-2 rounded-xl border border-slate-700/40 bg-slate-900/35">
      <p className="text-sm text-slate-400">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-1.5">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="p-2 rounded-lg border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-800/80 transition-colors"
        >
          <HiChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (page <= 3) {
            pageNum = i + 1;
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = page - 2 + i;
          }
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                pageNum === page
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'border border-slate-700 text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="p-2 rounded-lg border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-800/80 transition-colors"
        >
          <HiChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
