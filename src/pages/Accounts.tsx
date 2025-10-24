import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu, CircleIcon, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EnhancedSpendingChart } from "@/components/dashboard/EnhancedSpendingChart";
import { useAccounts } from "@/hooks/useAccounts";
import { EmptyAccountState } from "@/components/accounts/EmptyAccountState";
import { AddAccountDialog } from "@/components/accounts/AddAccountDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const Accounts = () => {
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  
  const { accounts, loading, error } = useAccounts();

  // Fetch transactions when expanding
  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40);

      if (error) throw error;
      setAllTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleSeeMore = () => {
    setExpanded(true);
    fetchTransactions();
  };

  const handleSeeLess = () => {
    setExpanded(false);
  };

  // Mock data for now - will use allTransactions when expanded
  const mockTransactions = [
    {
      id: 1,
      category: "Housing & Utilities",
      categoryColor: "bg-blue-100 text-blue-700",
      name: "Rent",
      date: "27 June 2025",
      amount: -13000.00
    },
    {
      id: 2,
      category: "Savings & Investments",
      categoryColor: "bg-green-100 text-green-700",
      name: "Savings transfer",
      date: "27 June 2025",
      amount: -7000.00
    },
    {
      id: 3,
      category: "Personal & Lifestyle",
      categoryColor: "bg-orange-100 text-orange-700",
      name: "Futbol",
      date: "27 June 2025",
      amount: -85.00
    }
  ];

  // Use mock data or real data based on expanded state
  const displayTransactions = expanded ? allTransactions : mockTransactions;

  // Filter transactions based on selected category
  const filteredTransactions = selectedCategory 
    ? displayTransactions.filter(t => t.category === selectedCategory)
    : displayTransactions;

  const handleCategoryClick = (category: string) => {
    // Toggle: if same category is clicked, clear the filter
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  // Helper to format transaction data from Supabase
  const formatTransaction = (transaction: any) => {
    return {
      id: transaction.id,
      category: "General", // You can map this based on category_id
      categoryColor: "bg-gray-100 text-gray-700",
      name: transaction.description || transaction.reference || "Transaction",
      date: new Date(transaction.transaction_date).toLocaleDateString('en-ZA', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }),
      amount: transaction.amount / 100 // Convert from cents
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-6 pb-20 space-y-6">
          <Skeleton className="h-[280px] rounded-3xl" />
          <Skeleton className="h-[200px] rounded-lg" />
          <Skeleton className="h-[300px] rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-6 pb-20">
          <Card className="p-6">
            <p className="text-destructive">Error loading accounts: {error}</p>
          </Card>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-6 pb-20 pt-6">
          <EmptyAccountState onClick={() => setAddAccountOpen(true)} />
          <AddAccountDialog 
            open={addAccountOpen} 
            onOpenChange={setAddAccountOpen}
          />
        </div>
      </div>
    );
  }

  const currentAccount = accounts[currentAccountIndex];

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 pb-20 space-y-6">
        {/* Account Card */}
        <Card className="rounded-3xl border border-border shadow-lg bg-muted/30">
          <CardContent className="p-6">
            {/* Bank Name with Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-12 bg-foreground rounded-lg flex items-center justify-center">
                <span className="text-background font-bold text-lg">
                  {currentAccount.name.charAt(0)}
                </span>
              </div>
              <h2 className="text-base font-bold text-foreground">{currentAccount.name}</h2>
            </div>

            {/* Budget Balance */}
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Budget Balance</p>
                <p className="text-4xl font-bold text-foreground">
                  R{currentAccount.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Available Balance: R{currentAccount.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Payment Provider Logo */}
              <div className="h-12 w-16 bg-foreground rounded-lg flex items-center justify-center">
                <div className="flex gap-1">
                  <div className="h-8 w-8 rounded-full bg-destructive opacity-80"></div>
                  <div className="h-8 w-8 rounded-full bg-secondary -ml-4"></div>
                </div>
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-1.5 mt-4">
              {accounts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentAccountIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentAccountIndex 
                      ? 'w-6 bg-foreground' 
                      : 'w-1.5 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">Recent transactions</h3>
            <div className="flex items-center gap-3">
              {selectedCategory && (
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                >
                  Clear filter
                </button>
              )}
              {expanded && (
                <button 
                  onClick={handleSeeLess}
                  className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                >
                  See less
                </button>
              )}
            </div>
          </div>
          
          <div className="space-y-0 border-t border-border animate-fade-in">
            {loadingTransactions ? (
              <div className="py-4 space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => {
                // Format if it's from Supabase
                const formattedTransaction = expanded 
                  ? formatTransaction(transaction)
                  : transaction;
                
                return (
                  <div 
                    key={formattedTransaction.id} 
                    className="py-4 border-b border-border animate-fade-in"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge 
                          variant="secondary" 
                          className={`mb-2 text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 ${formattedTransaction.categoryColor} ${selectedCategory === formattedTransaction.category ? 'ring-2 ring-foreground' : ''}`}
                          onClick={() => handleCategoryClick(formattedTransaction.category)}
                        >
                          {formattedTransaction.category}
                        </Badge>
                        <p className="font-semibold text-foreground text-base mb-1">
                          {formattedTransaction.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formattedTransaction.date}
                        </p>
                      </div>
                      <p className={`font-bold text-base ${formattedTransaction.amount < 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {formattedTransaction.amount < 0 ? '-' : '+'}R{Math.abs(formattedTransaction.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No transactions found
              </div>
            )}
          </div>

          {!expanded && filteredTransactions.length > 0 && (
            <button 
              onClick={handleSeeMore}
              className="text-sm text-foreground underline mt-3 font-medium hover:text-primary transition-colors"
            >
              see more
            </button>
          )}
        </div>

        {/* Spending Trend Chart */}
        <Card className="mt-2">
          <CardHeader>
            <CardTitle className="font-georama">Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedSpendingChart />
          </CardContent>
        </Card>

        <AddAccountDialog 
          open={addAccountOpen} 
          onOpenChange={setAddAccountOpen}
        />
      </div>
    </div>
  );
};

export default Accounts;
