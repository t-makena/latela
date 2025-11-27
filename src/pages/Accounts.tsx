import React, { useState } from "react";
import { useAccounts } from "@/hooks/useAccounts";
import { EmptyAccountState } from "@/components/accounts/EmptyAccountState";
import { StatementUploadDialog } from "@/components/accounts/StatementUploadDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountCard } from "@/components/accounts/AccountCard";
import { FinancialInsightContent } from "@/components/financial-insight/FinancialInsightContent";

const Accounts = () => {
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  
  const { accounts, loading, error } = useAccounts();

  const currentAccount = accounts[currentAccountIndex];

  // Safety check - should never happen due to guards above, but prevents crashes
  if (!currentAccount) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background px-6 pb-20">
      <div className="space-y-6">
        {/* Account Card with pagination */}
        <AccountCard 
          account={currentAccount}
          accounts={accounts}
          currentIndex={currentAccountIndex}
          onIndexChange={setCurrentAccountIndex}
          showPagination={true}
        />

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
