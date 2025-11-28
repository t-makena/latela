import React, { useState, useRef } from "react";
import { useAccounts } from "@/hooks/useAccounts";
import { EmptyAccountState } from "@/components/accounts/EmptyAccountState";
import { StatementUploadDialog } from "@/components/accounts/StatementUploadDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountCard } from "@/components/accounts/AccountCard";
import { FinancialInsightContent } from "@/components/financial-insight/FinancialInsightContent";
import { RecentTransactions } from "@/components/accounts/RecentTransactions";

const Accounts = () => {
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const transactionHistoryRef = useRef<HTMLDivElement>(null);
  
  const { accounts, loading, error } = useAccounts();

  const currentAccount = accounts[currentAccountIndex];

  // Safety check - should never happen due to guards above, but prevents crashes
  if (!currentAccount) {
    return null;
  }

  const scrollToTransactions = () => {
    transactionHistoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-background px-6 pb-20">
      <div className="space-y-6">
        {/* Account Card and Recent Transactions side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Card with pagination - half width on desktop */}
          <AccountCard 
            account={currentAccount}
            accounts={accounts}
            currentIndex={currentAccountIndex}
            onIndexChange={setCurrentAccountIndex}
            showPagination={true}
          />

          {/* Recent Transactions Card */}
          <RecentTransactions 
            accountId={currentAccount.id} 
            onSeeMore={scrollToTransactions}
          />
        </div>

        {/* Financial Insight Content */}
        <div ref={transactionHistoryRef}>
          <FinancialInsightContent />
        </div>

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
