
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialMetrics, formatCurrency, formatDate } from "@/lib/realData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Accounts = () => {
  const { accounts, loading, error } = useAccounts();
  const { transactions } = useTransactions();
  const { accountBalances } = calculateFinancialMetrics(transactions);
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);
  const isMobile = useIsMobile();

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
    <div className="min-h-screen bg-background">
      {/* Tablet View - Dropdown Menu */}
      {!isMobile && (
        <div className="p-4 border-b">
          <div className="max-w-md">
            <Select value={currentAccountIndex.toString()} onValueChange={(value) => setCurrentAccountIndex(parseInt(value))}>
              <SelectTrigger className="w-full bg-white border-gray-300 rounded-xl h-12">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
                {accounts.map((account, index) => (
                  <SelectItem key={account.id} value={index.toString()} className="hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: account.color }}
                      >
                        {cleanAccountName(account.name).charAt(0)}
                      </div>
                      <span>{cleanAccountName(account.name)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      <div className="p-4 space-y-6">
        {/* Budget Balance Card */}
        <Card className={`border border-border shadow-sm rounded-3xl ${!isMobile ? 'mx-0' : 'mx-4'}`}>
          <CardContent className="p-4 relative">
            {/* Arrows only for mobile */}
            {isMobile && (
              <>
                {/* Left Arrow */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent z-10"
                  onClick={() => handleScroll('up')}
                  disabled={currentAccountIndex === 0}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                {/* Right Arrow */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent z-10"
                  onClick={() => handleScroll('down')}
                  disabled={currentAccountIndex === accounts.length - 1}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}

            {/* Content container with padding to avoid arrows on mobile */}
            <div className={isMobile ? "px-8" : "px-4"}>
              <div className="flex items-center justify-between">
                {/* Left side with icon and text */}
                <div className="flex items-center gap-3">
                  <div 
                    className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: currentAccount.color }}
                  >
                    <span className="text-white font-bold text-lg">
                      {cleanedAccountName.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground mb-1 truncate">
                      {currentAccount.type?.charAt(0).toUpperCase() + currentAccount.type?.slice(1)} Account
                    </p>
                    <h2 className="text-lg font-bold text-foreground mb-1">Budget Balance</h2>
                    <p className="text-xs text-muted-foreground">Available Balance</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={`text-2xl font-bold ${accountBalance < 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {formatCurrency(accountBalance)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatCurrency(accountBalance)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dots Indicator - Mobile Only */}
        {isMobile && (
          <div className="flex justify-center space-x-2 mb-6 mt-4">
            {accounts.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentAccountIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentAccountIndex 
                    ? 'bg-foreground' 
                    : 'bg-muted-foreground'
                }`}
              />
            ))}
          </div>
        )}

        {/* Recent Transactions */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent transactions</h3>
          
          {accountTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No transactions found for this account.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accountTransactions.slice(0, 4).map((transaction, index) => (
                <Card key={`${transaction.acc_no}-${transaction.created_at}-${index}`} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm mb-1">
                          {transaction.source}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                      <p className={`font-bold text-sm ${
                        transaction.value < 0 ? 'text-destructive' : 'text-green-600'
                      }`}>
                        {formatCurrency(transaction.value)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Spending Trend */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Spending Trend</h3>
          <p className="text-sm text-muted-foreground mb-4">Since last year</p>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Chart will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Dots Indicator - Mobile Only */}
      {isMobile && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {accounts.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentAccountIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentAccountIndex 
                  ? 'bg-foreground w-6' 
                  : 'bg-muted-foreground'
              }`}
            />
          ))}
        </div>
      )}

      {/* Touch/Swipe Areas for Navigation - Mobile Only */}
      {isMobile && (
        <>
          <div 
            className="fixed top-0 left-0 w-full h-1/2 z-0"
            onClick={() => handleScroll('up')}
          />
          <div 
            className="fixed bottom-0 left-0 w-full h-1/2 z-0"
            onClick={() => handleScroll('down')}
          />
        </>
      )}
    </div>
  );
};

export default Accounts;
