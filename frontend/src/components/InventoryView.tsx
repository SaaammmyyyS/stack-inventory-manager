import { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Plus, Trash2, Loader2, PackageOpen, AlertCircle } from 'lucide-react';

export default function InventoryView() {
  const { optimisticItems, isLoading, error, isPending, addItem, deleteItem } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFormSubmit = async (formData: FormData) => {
    const name = formData.get("name") as string;
    const quantity = parseInt(formData.get("quantity") as string);
    await addItem(name, quantity);
    setIsModalOpen(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Inventory</h1>
          <p className="text-slate-500 font-medium">Manage your stock across organizations.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={20} /> Add Product
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="font-semibold text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading && optimisticItems.length === 0 ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-300" size={40} /></div>
        ) : optimisticItems.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <PackageOpen className="mx-auto text-slate-200" size={60} />
            <p className="text-slate-400 font-medium text-lg">No items found for this tenant.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-xs uppercase font-bold tracking-widest">
                <tr>
                  <th className="px-8 py-5">Product Details</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {optimisticItems.map((item) => (
                  <tr key={item.id} className={`group hover:bg-slate-50/50 transition-all ${item.isSending ? 'opacity-50' : ''}`}>
                    <td className="px-8 py-5">
                      <span className="font-bold text-slate-700 block text-lg">{item.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{item.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-black ${item.quantity > 5 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                        {item.quantity} IN STOCK
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white w-full max-w-md p-8 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-900 mb-2">New Product</h2>
            <form action={handleFormSubmit} className="space-y-4">
              <input name="name" type="text" required className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Product Name" />
              <input name="quantity" type="number" required className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Quantity" />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 font-bold py-4 hover:bg-slate-50 rounded-2xl">Cancel</button>
                <button type="submit" disabled={isPending} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl disabled:opacity-50">
                  {isPending ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}