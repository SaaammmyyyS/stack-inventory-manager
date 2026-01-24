import { useEffect, useState, useCallback, useOptimistic, useTransition } from 'react';
import { SignedIn, SignedOut, SignInButton, useUser, useAuth } from "@clerk/clerk-react";
import DashboardLayout from './components/DashboardLayout';
import { Plus, Trash2, Loader2, PackageOpen, AlertCircle, Package } from 'lucide-react';

// --- TYPES ---
interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  tenantId: string;
  isSending?: boolean;
}

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/inventory`;

export default function App() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [optimisticItems, addOptimisticItem] = useOptimistic(
    items,
    (state, newItem: InventoryItem) => [...state, { ...newItem, isSending: true }]
  );

  // --- 2. FETCH DATA ---
  const fetchItems = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const token = await getToken();

      // UPDATED: Removed /user.id from path.
      // The backend now gets the identity from the Bearer token automatically.
      const response = await fetch(API_BASE_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error("Could not load inventory");
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsLoading(false);
    }
  }, [user, getToken]);

  useEffect(() => {
    if (isUserLoaded && user) fetchItems();
  }, [isUserLoaded, user, fetchItems]);

  // --- 3. ADD ITEM ---
  const handleAddItem = async (formData: FormData) => {
    if (!user) return;
    const name = formData.get("name") as string;
    const quantity = parseInt(formData.get("quantity") as string);

    // Create a temporary object for the UI
    const tempItem: InventoryItem = {
      id: Math.random().toString(),
      name,
      quantity,
      tenantId: user.id
    };

    startTransition(async () => {
      addOptimisticItem(tempItem);
      setIsModalOpen(false);

      try {
        const token = await getToken();
        const response = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, quantity }) // tenantId is set by backend from JWT
        });

        if (!response.ok) throw new Error("Failed to save");
        fetchItems(); // Refresh with real data from DB
      } catch (err) {
        setError("Failed to save item. Rolling back...");
        fetchItems(); // Rollback optimistic UI
      }
    });
  };

  // --- 4. DELETE ITEM ---
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      const token = await getToken();
      // Path remains API_BASE_URL/ID (e.g., /api/inventory/uuid)
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Delete failed");

      // Update local state immediately after success
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError("Delete failed. You might not have permission.");
    }
  };

  if (!isUserLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <>
      <SignedOut>
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-blue-100">
              <Package className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Personal Admin Suite</h1>
            <p className="text-slate-500">Sign in to manage your inventory and AI tools securely.</p>
            <SignInButton mode="modal">
              <button className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-lg">
                Access Dashboard
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <DashboardLayout>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-black text-slate-900">Inventory</h1>
              <p className="text-slate-500 font-medium">Tracking {items.length} items across your platform.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus size={20} /> Add Product
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
              <AlertCircle size={20} />
              <p className="font-semibold text-sm">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading && items.length === 0 ? (
              <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-300" size={40} /></div>
            ) : optimisticItems.length === 0 ? (
              <div className="p-20 text-center space-y-4">
                <PackageOpen className="mx-auto text-slate-200" size={60} />
                <p className="text-slate-400 font-medium text-lg">Your inventory is empty.</p>
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
                            onClick={() => handleDelete(item.id)}
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
                <p className="text-slate-500 mb-8 text-sm">Add a new item to your local inventory tracking.</p>

                <form action={handleAddItem} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1 block px-1">Product Name</label>
                    <input name="name" type="text" required autoFocus className="w-full bg-slate-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="e.g. Wireless Mouse" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1 block px-1">Quantity</label>
                    <input name="quantity" type="number" required min="1" className="w-full bg-slate-50 border-none p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="0" />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 text-slate-500 font-bold py-4 hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                    <button type="submit" disabled={isPending} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50">
                      {isPending ? 'Saving...' : 'Confirm'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </DashboardLayout>
      </SignedIn>
    </>
  );
}