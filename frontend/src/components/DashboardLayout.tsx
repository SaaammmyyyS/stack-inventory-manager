import { useState } from 'react';
import { UserButton, useUser, OrganizationSwitcher } from "@clerk/clerk-react";
import {
  Package,
  LayoutDashboard,
  Settings,
  MessageSquare,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  CreditCard
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'AI Tools', href: '/ai-tools', icon: MessageSquare, isNew: true },
    { name: 'Billing', href: '/billing', icon: CreditCard },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200
        transition-transform duration-300 ease-in-out transform
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 flex flex-col h-full
      `}>
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-xl shadow-blue-100">
                <Package size={24} strokeWidth={2.5} />
              </div>
              <span className="font-black text-2xl tracking-tight text-slate-900">
                SaaS<span className="text-blue-600">Mgr</span>
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-xl"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-3">
              Workspaces
            </p>
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-1.5">
              <OrganizationSwitcher
                hidePersonal={false}
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    organizationSwitcherTrigger: "w-full justify-between bg-white border border-slate-200/50 shadow-sm hover:bg-slate-50 transition-all py-2.5 px-4 rounded-xl",
                    organizationPreviewMainIdentifier: "text-sm font-bold text-slate-800",
                  }
                }}
              />
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 space-y-1.5 custom-scrollbar">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-3">
            Management
          </p>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all
                  ${isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}
                `}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  {item.name}
                  {item.isNew && !isActive && (
                    <span className="bg-blue-50 text-[10px] text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                       <Sparkles size={10} /> NEW
                    </span>
                  )}
                </div>
                {isActive && <ChevronRight size={16} className="opacity-70" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200/50 rounded-2xl shadow-sm hover:bg-slate-100 transition-colors">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-10 h-10 border-2 border-white shadow-sm"
                }
              }}
            />
            <div className="overflow-hidden">
              <p className="text-sm font-black text-slate-900 truncate leading-none mb-1">
                {user?.firstName || 'Admin'}
              </p>
              <p className="text-[10px] text-slate-500 font-bold truncate uppercase tracking-tighter">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <Package size={18} />
            </div>
            <span className="font-black text-slate-900 tracking-tight text-lg">SaaSManager</span>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 md:p-10 lg:p-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}