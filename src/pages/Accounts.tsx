
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialMetrics, formatCurrency, formatDate } from "@/lib/realData";

const Accounts = () => {
  const { accounts, loading, error } = useAccounts();
  const { transactions } = useTransactions();
  const { accountBalances } = calculateFinancialMetrics(transactions);
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);

  // Function to clean account names by removing redundant text
  const cleanAccountName = (name: string) => {
    return name
      .replace(/\s+Cheque$/i, '')
      .replace(/\s+Savings$/i, '')
      .replace(/\s+Credit$/i, '')
      .trim();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-32 w-80 bg-gray-200 rounded-2xl mb-8"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-destructive">Error loading accounts: {error}</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-muted-foreground">No accounts found.</p>
      </div>
    );
  }

  const currentAccount = accounts[currentAccountIndex];
  const accountBalance = accountBalances[parseInt(currentAccount.id)] || 0;
  const cleanedAccountName = cleanAccountName(currentAccount.name);

  // Get transactions for current account
  const accountTransactions = transactions
    .filter(t => t.acc_no.toString() === currentAccount.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleScroll = (direction: 'up' | 'down') => {
    if (direction === 'down' && currentAccountIndex < accounts.length - 1) {
      setCurrentAccountIndex(currentAccountIndex + 1);
    } else if (direction === 'up' && currentAccountIndex > 0) {
      setCurrentAccountIndex(currentAccountIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Floating Bank Details Card */}
      <div className="sticky top-4 z-10 px-4 mb-6">
        <Card className="mx-auto max-w-sm shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="h-12 w-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: currentAccount.color }}
              >
                <span className="text-white font-bold text-lg">
                  {cleanedAccountName.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold font-georama">{cleanedAccountName}</h2>
                <p className="text-sm text-muted-foreground capitalize">{currentAccount.type} Account</p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-georama mb-1">Current Balance</p>
              <p className={`text-3xl font-bold font-georama ${accountBalance < 0 ? 'text-destructive' : 'text-green-600'}`}>
                {formatCurrency(accountBalance)}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-georama">Type</p>
                <p className="text-sm font-semibold capitalize font-georama">{currentAccount.type}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-georama">Currency</p>
                <p className="text-sm font-semibold font-georama">{currentAccount.currency}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions - Flat on Background */}
      <div className="px-4 pb-20">
        <h3 className="text-lg font-semibold font-georama mb-4 text-center">Recent Transactions</h3>
        
        {accountTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No transactions found for this account.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-md mx-auto">
            {accountTransactions.map((transaction, index) => (
              <div 
                key={`${transaction.acc_no}-${transaction.created_at}-${index}`}
                className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium font-georama text-sm mb-1">
                      {transaction.source}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                  <p className={`font-bold font-georama text-sm ${
                    transaction.value < 0 ? 'text-destructive' : 'text-green-600'
                  }`}>
                    {formatCurrency(transaction.value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Dots Indicator */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {accounts.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentAccountIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentAccountIndex 
                ? 'bg-black w-6' 
                : 'bg-gray-400'
            }`}
          />
        ))}
      </div>

      {/* Touch/Swipe Areas for Navigation */}
      <div 
        className="fixed top-0 left-0 w-full h-1/2 z-0"
        onClick={() => handleScroll('up')}
      />
      <div 
        className="fixed bottom-0 left-0 w-full h-1/2 z-0"
        onClick={() => handleScroll('down')}
      />
    </div>
  );
};

export default Accounts;
