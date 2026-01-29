import { useAuth } from "@clerk/clerk-react";
import { ReactNode } from "react";

interface PlanGuardProps {
  children: ReactNode;
  planId: string;
  fallback?: ReactNode;
}

export default function PlanGuard({ children, planId, fallback = null }: PlanGuardProps) {
  const { has, isLoaded } = useAuth();

  if (!isLoaded) return null;

  const isAllowed = has({ plan: planId });

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}