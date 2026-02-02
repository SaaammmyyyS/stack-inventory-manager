import { useAuth, useOrganization } from "@clerk/clerk-react";
import { toast } from "sonner";

export const useInventoryApi = () => {
  const { getToken } = useAuth();
  const { organization } = useOrganization();

  const fetchWithTenant = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();

    const tenantId = organization?.id || "personal";
    const plan = (organization?.publicMetadata?.plan as string) || "free";

    const headers: HeadersInit = {
        ...options.headers,
        "Authorization": `Bearer ${token}`,
        "X-Tenant-ID": tenantId,
        "X-Organization-Plan": plan,
        "Content-Type": "application/json",
    };

    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

    try {
        const response = await fetch(`${baseUrl}${url}`, { ...options, headers });

        if (response.status === 429) {
            toast.error("Rate limit exceeded", {
                description: "You're moving a bit too fast! Please wait a moment.",
            });
        }

        if (response.status === 402) {
            toast.warning("Plan limit reached", {
                description: "You've hit your plan's limit. Please upgrade in the Billing section.",
            });
        }

        return response;
    } catch (error) {
        toast.error("Connection error", {
            description: "Could not reach the server. Please check your internet.",
        });
        throw error;
    }
  };

  return { fetchWithTenant };
};