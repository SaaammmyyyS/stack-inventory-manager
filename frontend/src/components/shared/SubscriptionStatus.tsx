import { usePlans, useOrganization } from "@clerk/clerk-react";

export default function SubscriptionStatus() {
  const { organization } = useOrganization();

  const { data: plans, isLoading } = usePlans({
    for: 'organization',
    enabled: !!organization?.id
  });

  if (isLoading) return <div>Loading subscription...</div>;

  const activePlan = plans?.find(plan => plan.isCurrent);

  return (
    <div className="p-4 border rounded shadow">
      <h3>Current Plan: {activePlan?.name || "Free"}</h3>
      <p>Status: {activePlan ? "Active" : "No paid subscription"}</p>
    </div>
  );
}