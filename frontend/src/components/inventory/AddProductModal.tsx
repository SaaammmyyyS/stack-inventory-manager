interface Props {
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}

export default function AddProductModal({ isOpen, isPending, onClose, onSubmit }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-lg p-10 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="text-3xl font-black text-slate-900 mb-1">Add Product</h2>
        <form action={onSubmit} className="space-y-4 pt-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" type="text" required className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="Item Name" />
            <input name="sku" type="text" className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-mono" placeholder="SKU (e.g. ELEC-01)" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="category" type="text" className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="Category" />
            <input name="quantity" type="number" required className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="Initial Quantity" />
          </div>
          <div className="flex gap-4 pt-6">
            <button type="button" onClick={onClose} className="flex-1 font-bold py-4 text-slate-400 hover:bg-slate-50 rounded-2xl transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-50">
              {isPending ? 'Processing...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}