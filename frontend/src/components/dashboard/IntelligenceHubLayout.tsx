import { ReactNode } from "react";
import { useContentAwareHeight } from "@/hooks/useContentAwareHeight";

interface IntelligenceHubLayoutProps {
  children: ReactNode;
  className?: string;
}

export function IntelligenceHubLayout({ children, className = "" }: IntelligenceHubLayoutProps) {
  const { height, containerRef, isCalculating } = useContentAwareHeight<HTMLDivElement>({
    minHeight: 500,
    maxHeight: window.innerHeight > 900 ? 800 : 600,
    offset: 250,
    debounceMs: 150
  });

  return (
    <div
      ref={containerRef}
      className={`
        bg-[#0F172A] rounded-[2rem] text-white shadow-2xl shadow-blue-900/20
        relative overflow-hidden border border-white/10
        flex flex-col transition-all duration-300 ease-in-out
        ${isCalculating ? 'opacity-90' : 'opacity-100'}
        md:rounded-[1.5rem] sm:rounded-[1rem]
        ${className}
      `}
      style={{
        height: `${height}px`,
        minHeight: '500px'
      }}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -mr-32 -mt-32" />

      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
