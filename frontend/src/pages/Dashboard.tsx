import { useEffect, useState } from "react";
import { useInventoryApi } from "../lib/api";
import { useOrganization } from "@clerk/clerk-react";

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const { fetchWithTenant } = useInventoryApi();
  const { organization } = useOrganization(); // Monitor for changes

  useEffect(() => {
    const loadItems = async () => {
      const response = await fetchWithTenant("/api/inventory");
      const data = await response.json();
      setItems(data);
    };

    loadItems();
  }, [organization?.id]);

  return (
    <div>
      <h2>Inventory for {organization?.name || "Personal"}</h2>
    </div>
  );
}