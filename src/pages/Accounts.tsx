import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu, CircleIcon, X, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EnhancedSpendingChart } from "@/components/dashboard/EnhancedSpendingChart";
import { useAccounts } from "@/hooks/useAccounts";
import { EmptyAccountState } from "@/components/accounts/EmptyAccountState";
import { StatementUploadDialog } from "@/components/accounts/StatementUploadDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

const Accounts = () => {
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [generatingTransactions, setGeneratingTransactions] = useState(false);
  const isMobile = useIsMobile();
  
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

  // Use real transactions data
  const displayTransactions = allTransactions;

  // Filter transactions based on selected category
  const filteredTransactions = selectedCategory 
    ? displayTransactions.filter(t => t.category === selectedCategory)
    : displayTransactions;

  const handleCategoryClick = (category: string) => {
    // Toggle: if same category is clicked, clear the filter
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  // Generate test transactions
  const handleGenerateTestData = async () => {
    setGeneratingTransactions(true);
    toast.info("Generating test transactions...");
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-test-transactions', {
        body: { count: 50 }
      });

      if (error) throw error;

      toast.success(`Successfully generated ${data.count} test transactions!`);
      
      // Refresh transactions if expanded
      if (expanded) {
        fetchTransactions();
      }
      
      // Reload page to update account balance
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      console.error('Error generating transactions:', err);
      toast.error('Failed to generate test transactions');
    } finally {
      setGeneratingTransactions(false);
    }
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
          <StatementUploadDialog 
            open={addAccountOpen} 
            onOpenChange={setAddAccountOpen}
            onSuccess={() => window.location.reload()}
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateTestData}
                disabled={generatingTransactions}
                className="text-xs h-7"
              >
                <Plus className="h-3 w-3 mr-1" />
                {generatingTransactions ? "Generating..." : "Add Test Data"}
              </Button>
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
        {isMobile ? (
          <div className="mt-2 -mx-6">
            <EnhancedSpendingChart />
          </div>
        ) : (
          <Card className="mt-2">
            <CardContent className="p-0">
              <EnhancedSpendingChart />
            </CardContent>
          </Card>
        )}

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
