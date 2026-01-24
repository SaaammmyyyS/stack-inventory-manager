import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/clerk-react";
import DashboardLayout from './components/DashboardLayout';
import InventoryView from "./components/InventoryView";
import { Package, Loader2 } from 'lucide-react';

export default function App() {
  const { isLoaded: isUserLoaded } = useUser();

  if (!isUserLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <>
      <SignedOut>
        <LoginHero />
      </SignedOut>

      <SignedIn>
        <DashboardLayout>
          <InventoryView />
        </DashboardLayout>
      </SignedIn>
    </>
  );
}

function LoginHero() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-blue-100">
          <Package className="text-white" size={32} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">SaaS Manager</h1>
        <p className="text-slate-500">Manage multiple organizations and inventory with AI-powered tools.</p>
        <SignInButton mode="modal">
          <button className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-lg">
            Access Dashboard
          </button>
        </SignInButton>
      </div>
    </div>
  );
}