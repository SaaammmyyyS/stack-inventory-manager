import { AlertTriangle } from 'lucide-react';

interface Props {
  itemName: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({ itemName, onClose, onConfirm }: Props) {
  if (!itemName) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[90] p-4">
      <div className="bg-white w-full max-w-sm p-8 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">Are you sure?</h3>
        <p className="text-slate-500 text-sm mb-8 font-medium">
          You are about to delete <span className="text-slate-900 font-bold">"{itemName}"</span>. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-100 hover:bg-red-700 transition-all active:scale-95"
          >
            Delete Item
          </button>
        </div>
      </div>
    </div>
  );
}