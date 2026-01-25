import { useState } from 'react';
import { UserButton, useUser, OrganizationSwitcher } from "@clerk/clerk-react";
import {
  Package,
  LayoutDashboard,
  Settings,
  MessageSquare,
  Menu,
  X,
  ChevronRight
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, active: false },
    { name: 'Inventory', icon: Package, active: true },
    { name: 'AI Tools', icon: MessageSquare, active: false },
    { name: 'Settings', icon: Settings, active: false },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200
        transition-transform duration-300 ease-in-out transform
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
                <Package size={22} />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">SaaSManager</span>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-8 px-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
              Active Tenant
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
               <OrganizationSwitcher
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    organizationSwitcherTrigger: "w-full justify-between bg-transparent hover:bg-slate-100 transition-colors py-2 px-3",
                    organizationPreviewTextContainer: "text-left",
                    organizationPreviewMainIdentifier: "text-sm font-bold text-slate-900",
                  }
                }}
              />
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-3">
              Menu
            </p>
            {navigation.map((item) => (
              <button
                key={item.name}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all
                  ${item.active
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}
                `}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} />
                  {item.name}
                </div>
                {item.active && <ChevronRight size={14} />}
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-slate-100 flex items-center gap-3 px-2">
            <UserButton afterSignOutUrl="/" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.firstName || 'Admin'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Package className="text-blue-600" size={24} />
            <span className="font-bold text-slate-900">SaaSManager</span>
          </div>
          <button onClick={() => setIsOpen(true)} className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg">
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4 md:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}