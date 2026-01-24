import { useAuth, useOrganization } from "@clerk/clerk-react";

export const useInventoryApi = () => {
  const { getToken } = useAuth();
  const { organization } = useOrganization();

  const fetchWithTenant = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();

    const tenantId = organization?.id || "personal";

    const headers: HeadersInit = {
        ...options.headers,
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
        "Content-Type": "application/json",
    };

    return fetch(`http://localhost:8080${url}`, { ...options, headers });
  };

  return { fetchWithTenant };
};