import { useParams } from "react-router-dom";
import { useAccounts } from "@/hooks/useAccounts";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FinancialInsightContent } from "@/components/financial-insight/FinancialInsightContent";
import { AccountCard } from "@/components/accounts/AccountCard";
import { MobileAccountCard } from "@/components/accounts/MobileAccountCard";
import { MobileBudgetInsightCard } from "@/components/accounts/MobileBudgetInsightCard";
import { useIsMobile } from "@/hooks/use-mobile";

const AccountDetail = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const { accounts, loading, error } = useAccounts();
  const isMobile = useIsMobile();

  if (loading) {
    if (isMobile) {
      return (
        <div className="min-h-screen bg-white py-6 space-y-5">
          <Skeleton 
            className="h-24 rounded-2xl border border-black" 
            style={{ boxShadow: '3px 3px 0px #000000' }}
          />
          <Skeleton className="h-6 w-32" />
          <Skeleton 
            className="h-[400px] rounded-3xl border-2 border-black" 
            style={{ boxShadow: '3px 3px 0px #000000' }}
          />
        </div>
      );
    }
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

  // Mobile neo-brutalist layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-white py-6 space-y-5 animate-fade-in">
        <MobileAccountCard account={account} />
        <MobileBudgetInsightCard />
      </div>
    );
  }

  // Desktop layout
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
