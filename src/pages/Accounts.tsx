import React, { useState } from "react";
import { useAccounts } from "@/hooks/useAccounts";
import { EmptyAccountState } from "@/components/accounts/EmptyAccountState";
import { StatementUploadDialog } from "@/components/accounts/StatementUploadDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { FinancialInsightContent } from "@/components/financial-insight/FinancialInsightContent";
import { MobileAccountCard } from "@/components/accounts/MobileAccountCard";
import { MobileBudgetInsightCard } from "@/components/accounts/MobileBudgetInsightCard";
import { useIsMobile } from "@/hooks/use-mobile";

const Accounts = () => {
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const { accounts, loading, error } = useAccounts();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen pt-6 px-6">
        <Skeleton className="h-[280px] w-full rounded-3xl" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen pt-6 px-6">
        <p className="text-destructive">Failed to load accounts: {error}</p>
      </div>
    );
  }

  // Empty state - show upload card when no accounts exist
  if (accounts.length === 0) {
    return (
      <div className="min-h-screen pt-6 px-6">
        <EmptyAccountState onClick={() => setAddAccountOpen(true)} />
        <StatementUploadDialog 
          open={addAccountOpen} 
          onOpenChange={setAddAccountOpen}
          onSuccess={() => window.location.reload()}
        />
      </div>
    );
  }

  // Mobile neo-brutalist layout
  if (isMobile) {
    return (
      <div className="min-h-screen py-6 space-y-5 animate-fade-in">
        {accounts.map(account => (
          <MobileAccountCard key={account.id} account={account} />
        ))}
        <MobileBudgetInsightCard />
        
        <StatementUploadDialog 
          open={addAccountOpen} 
          onOpenChange={setAddAccountOpen}
          onSuccess={() => window.location.reload()}
        />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen pt-6 px-6 pb-20">
      <div className="space-y-6">
        <FinancialInsightContent />

        <StatementUploadDialog 
          open={addAccountOpen} 
          onOpenChange={setAddAccountOpen}
          onSuccess={() => window.location.reload()}
        />
      </div>
    </div>
  );
};

export default Accounts;
