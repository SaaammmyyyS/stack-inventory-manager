import { SignedIn, SignedOut, SignInButton, useUser, useOrganization } from "@clerk/clerk-react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from './components/DashboardLayout';
import InventoryView from "./pages/InventoryView";
import Dashboard from "./pages/Dashboard";
import BillingView from "./pages/BillingView";
import { Package, Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';

export default function App() {
  const { isLoaded: isUserLoaded } = useUser();
  const { isLoaded: isOrgLoaded } = useOrganization();

  return (
    <>
      <Toaster position="top-right" richColors closeButton />

      {(!isUserLoaded || !isOrgLoaded) ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <Package className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={16} />
            </div>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Syncing Session</p>
          </div>
        </div>
      ) : (
        <>
          <SignedOut>
            <LoginHero />
          </SignedOut>

          <SignedIn>
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/inventory" element={<InventoryView />} />
                <Route path="/billing" element={<BillingView />} />

                <Route path="/ai-tools" element={
                  <PlaceholderModule title="AI Tools" description="Module coming soon..." />
                } />
                <Route path="/settings" element={
                  <PlaceholderModule title="Settings" description="Module coming soon..." />
                } />

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </SignedIn>
        </>
      )}
    </>
  );
}

function PlaceholderModule({ title, description }: { title: string; description: string }) {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
        <Package size={32} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <p className="text-slate-500 font-medium">{description}</p>
      </div>
    </div>
  );
}

function LoginHero() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-6">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="bg-blue-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-200">
          <Package className="text-white" size={48} strokeWidth={2.5} />
        </div>

        <div className="space-y-3">
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 italic">SaaSManager</h1>
          <p className="text-slate-500 font-medium text-lg leading-relaxed">
            Enterprise-grade multi-tenant inventory with AI insights.
          </p>
        </div>

        <SignInButton mode="modal">
          <button className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl hover:bg-blue-600 transition-all shadow-xl hover:shadow-blue-100 active:scale-95 group">
            Access Dashboard
          </button>
        </SignInButton>

        <div className="pt-8 flex flex-col items-center gap-2">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            Secure Infrastructure
          </p>
          <div className="flex gap-4 opacity-50 grayscale">
            <span className="text-xs font-black text-slate-600">AWS</span>
            <span className="text-xs font-black text-slate-600">CLERK</span>
            <span className="text-xs font-black text-slate-600">STRIPE</span>
          </div>
        </div>
      </div>
    </div>
  );
}