import { ReactNode } from "react";

interface IntelligenceHubLayoutProps {
  children: ReactNode;
  className?: string;
}

export function IntelligenceHubLayout({ children, className = "" }: IntelligenceHubLayoutProps) {
  return (
    <div
      className={`
        bg-[#0F172A] rounded-[2rem] text-white shadow-2xl shadow-blue-900/20
        relative overflow-hidden border border-white/10
        max-h-[600px] flex flex-col
        ${className}
      `}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -mr-32 -mt-32" />
      
      <div className="relative z-10 flex flex-col h-full">
        {children}
      </div>
    </div>
  );
}
