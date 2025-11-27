import { useParams } from "react-router-dom";
import { useAccounts } from "@/hooks/useAccounts";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FinancialInsightContent } from "@/components/financial-insight/FinancialInsightContent";
import { AccountCard } from "@/components/accounts/AccountCard";

const AccountDetail = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const { accounts, loading, error } = useAccounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-6 pb-20">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background px-6 pb-20">
        <Alert variant="destructive">
          <AlertDescription>Error loading account: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const account = accounts.find(a => a.id === accountId);

  if (!account) {
    return (
      <div className="min-h-screen bg-background px-6 pb-20">
        <Alert variant="destructive">
          <AlertDescription>Account not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 pb-20">
      <div className="space-y-6">
        {/* Account Card */}
        <AccountCard account={account} />
        
        {/* Financial Insight Content */}
        <FinancialInsightContent accountId={accountId} />
      </div>
    </div>
  );
};

export default AccountDetail;