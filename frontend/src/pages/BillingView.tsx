import { PricingTable, useOrganization } from "@clerk/clerk-react";
import { useInventory } from "../hooks/useInventory";
import { Button } from "../components/ui/button";
import { RefreshCcw } from "lucide-react";

export default function BillingView() {
  const { organization, isLoaded } = useOrganization();
  const { currentPlan, refreshPlan, isLoading } = useInventory();

  if (!isLoaded || !organization) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground text-lg">
          Please select an organization to manage billing.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-end border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
          <p className="text-muted-foreground mt-1">
            Manage your plan and organization billing cycles.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg border">
            <span className="text-sm font-medium">Current Plan:</span>
            <span className="text-sm font-bold uppercase text-primary tracking-wider">
              {currentPlan}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshPlan}
            disabled={isLoading}
            className="text-xs h-8"
          >
            <RefreshCcw className={`mr-2 h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Status
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-1">
        <PricingTable
          for="organization"
          newSubscriptionRedirectUrl={window.location.origin + "/dashboard"}
        />
      </div>
    </div>
  );
}