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
        bg-white rounded-[2rem] text-slate-900 shadow-sm border border-slate-200
        relative overflow-hidden
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
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 blur-[100px] -mr-32 -mt-32 opacity-50" />

      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
