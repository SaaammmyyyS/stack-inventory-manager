import { useState, useEffect } from 'react';
import { useAuth } from "@clerk/clerk-react";

export function useJWTAuth() {
  const { getToken } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [plan, setPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parseJWT = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = await getToken({ template: "spring-boot-backend" });
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));

          const jwtIsAdmin = payload.org_role === "org:admin";
          setIsAdmin(jwtIsAdmin);
          
          const jwtPlan = (payload.org_plan || 'free').toLowerCase();
          setPlan(jwtPlan);

          console.log('JWT Auth parsed:', {
            isAdmin: jwtIsAdmin,
            plan: jwtPlan,
            orgId: payload.org_id,
            orgRole: payload.org_role,
            orgPlan: payload.org_plan
          });
        } else {
          console.warn('No token available for JWT parsing');
          setIsAdmin(false);
          setPlan('free');
        }
      } catch (error) {
        console.error('JWT parsing failed:', error);
        setError('Failed to parse authorization token');
        setIsAdmin(false);
        setPlan('free');
      } finally {
        setIsLoading(false);
      }
    };

    parseJWT();
  }, [getToken]);

  return { isAdmin, plan, isLoading, error };
}
