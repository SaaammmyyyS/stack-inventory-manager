import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  density?: 'compact' | 'comfortable' | 'spacious';
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 3, density = 'comfortable' }) => {
  const densityStyles = {
    compact: 'h-8',
    comfortable: 'h-12',
    spacious: 'h-16'
  };

  const rowHeight = densityStyles[density];

  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className={`${rowHeight} bg-slate-100 rounded-lg`} />
        </div>
      ))}
    </div>
  );
};

export default TableSkeleton;
