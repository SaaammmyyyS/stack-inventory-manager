import React from 'react';
import { Loader2 } from 'lucide-react';

const PaginationLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-4 gap-2 text-slate-400">
      <Loader2 className="animate-spin" size={16} />
      <span className="text-xs font-medium">Loading page...</span>
    </div>
  );
};

export default PaginationLoader;
