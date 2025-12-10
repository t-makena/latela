import React, { useState } from "react";
import { useAccounts } from "@/hooks/useAccounts";
import { EmptyAccountState } from "@/components/accounts/EmptyAccountState";
import { StatementUploadDialog } from "@/components/accounts/StatementUploadDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountCard } from "@/components/accounts/AccountCard";
import { FinancialInsightContent } from "@/components/financial-insight/FinancialInsightContent";
import { CompactRecentTransactions } from "@/components/accounts/CompactRecentTransactions";
import { MobileAccountCard } from "@/components/accounts/MobileAccountCard";
import { MobileBudgetInsightCard } from "@/components/accounts/MobileBudgetInsightCard";
import { useIsMobile } from "@/hooks/use-mobile";

const Accounts = () => {
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const { accounts, loading, error } = useAccounts();

  const currentAccount = accounts[currentAccountIndex];

  // Safety check - should never happen due to guards above, but prevents crashes
  if (!currentAccount) {
    return null;
  }

  const scrollToTransactions = () => {
    document.getElementById('transaction-history')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Mobile neo-brutalist layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-white px-6 py-6 space-y-5 animate-fade-in">
        <MobileAccountCard account={currentAccount} />
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
    <div className="min-h-screen bg-background px-6 pb-20">
      <div className="space-y-6">
        {/* Account Card and Recent Transactions side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AccountCard 
            account={currentAccount}
            accounts={accounts}
            currentIndex={currentAccountIndex}
            onIndexChange={setCurrentAccountIndex}
            showPagination={true}
          />
          
          <CompactRecentTransactions 
            accountId={currentAccount.id}
            onSeeMore={scrollToTransactions}
          />
        </div>

        {/* Financial Insight Content */}
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
