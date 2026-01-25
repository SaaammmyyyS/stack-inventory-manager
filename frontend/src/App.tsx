import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/clerk-react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from './components/DashboardLayout';
import InventoryView from "./components/InventoryView";
import Dashboard from "./pages/Dashboard";
import { Package, Loader2 } from 'lucide-react';

export default function App() {
  const { isLoaded: isUserLoaded } = useUser();

  if (!isUserLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Session...</p>
      </div>
    </div>
  );

  return (
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

            <Route path="/ai-tools" element={
              <div className="py-20 text-center text-slate-400 font-medium">AI Tools module coming soon...</div>
            } />
            <Route path="/settings" element={
              <div className="py-20 text-center text-slate-400 font-medium">Settings module coming soon...</div>
            } />
          </Routes>
        </DashboardLayout>
      </SignedIn>
    </>
  );
}

function LoginHero() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-6">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="bg-blue-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-200">
          <Package className="text-white" size={40} strokeWidth={2.5} />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">SaaSManager</h1>
          <p className="text-slate-500 font-medium text-lg leading-relaxed">
            Professional multi-tenant inventory management with AI-powered insights.
          </p>
        </div>

        <SignInButton mode="modal">
          <button className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl hover:bg-blue-600 transition-all shadow-xl hover:shadow-blue-100 active:scale-95 group">
            Access Dashboard
          </button>
        </SignInButton>

        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
          Securely powered by Clerk & AWS
        </p>
      </div>
    </div>
  );
}