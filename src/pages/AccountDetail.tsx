import { useParams } from "react-router-dom";
import { useAccounts } from "@/hooks/useAccounts";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FinancialInsightContent } from "@/components/financial-insight/FinancialInsightContent";
import { MobileBudgetInsightCard } from "@/components/accounts/MobileBudgetInsightCard";
import { useIsMobile } from "@/hooks/use-mobile";

const AccountDetail = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const { accounts, loading, error } = useAccounts();
  const isMobile = useIsMobile();

  if (loading) {
    if (isMobile) {
      return (
        <div className="min-h-screen py-6 space-y-5">
          <Skeleton
            className="h-24 rounded-2xl dark:border-0"
            style={{ boxShadow: 'var(--brutalist-shadow)', borderWidth: 'var(--brutalist-border-width)', borderStyle: 'solid', borderColor: 'var(--brutalist-border-color)', background: 'var(--brutalist-card-bg)' }}
          />
          <Skeleton className="h-6 w-32" />
          <Skeleton
            className="h-[400px] rounded-3xl dark:border-0"
            style={{ boxShadow: 'var(--brutalist-shadow)', borderWidth: 'var(--brutalist-border-width)', borderStyle: 'solid', borderColor: 'var(--brutalist-border-color)', background: 'var(--brutalist-card-bg)' }}
          />
        </div>
      );
    }
    return (
      <div className="min-h-screen px-6 pb-20">
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
      <div className="min-h-screen px-6 pb-20">
        <Alert variant="destructive">
          <AlertDescription>Error loading account: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const account = accounts.find(a => a.id === accountId);

  if (!account) {
    return (
      <div className="min-h-screen px-6 pb-20">
        <Alert variant="destructive">
          <AlertDescription>Account not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen py-6 space-y-5 animate-fade-in">
        <MobileBudgetInsightCard titleKey="finance.accountInsight" accountId={accountId} />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen pt-6 px-6 pb-20">
      <FinancialInsightContent accountId={accountId} />
    </div>
  );
};

export default AccountDetail;
