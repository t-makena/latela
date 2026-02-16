import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAccounts } from "@/hooks/useAccounts";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FinancialInsightContent } from "@/components/financial-insight/FinancialInsightContent";
import { AccountCard } from "@/components/accounts/AccountCard";
import { MobileAccountCard } from "@/components/accounts/MobileAccountCard";
import { MobileBudgetInsightCard } from "@/components/accounts/MobileBudgetInsightCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AccountDetail = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const { accounts, loading, error } = useAccounts();
  const isMobile = useIsMobile();
  const [recategorizing, setRecategorizing] = useState(false);
  const { toast } = useToast();

  const handleRecategorize = async () => {
    if (!accountId) return;
    setRecategorizing(true);
    try {
      let remaining = Infinity;
      let totalCategorized = 0;
      while (remaining > 0) {
        const { data, error } = await supabase.functions.invoke('categorize-transactions', {
          body: { accountId }
        });
        if (error || !data?.success) break;
        totalCategorized += data.categorized || 0;
        remaining = data.remaining || 0;
      }
      toast({
        title: totalCategorized > 0 ? "Categorization complete" : "All caught up",
        description: totalCategorized > 0 
          ? `${totalCategorized} transactions categorized` 
          : "No uncategorized transactions found",
      });
    } catch (err) {
      toast({ title: "Error", description: "Failed to categorize transactions", variant: "destructive" });
    } finally {
      setRecategorizing(false);
    }
  };

  if (loading) {
    if (isMobile) {
      return (
        <div className="min-h-screen bg-white py-6 space-y-5">
          <Skeleton 
            className="h-24 rounded-2xl border border-black" 
            style={{ boxShadow: '4px 4px 0px #000000' }}
          />
          <Skeleton className="h-6 w-32" />
          <Skeleton 
            className="h-[400px] rounded-3xl border-2 border-black" 
            style={{ boxShadow: '4px 4px 0px #000000' }}
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
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRecategorize} 
            disabled={recategorizing}
            className="border-black"
            style={{ boxShadow: '2px 2px 0px #000000' }}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${recategorizing ? 'animate-spin' : ''}`} />
            {recategorizing ? 'Categorizing...' : 'Re-categorize'}
          </Button>
        </div>
        <MobileBudgetInsightCard titleKey="finance.accountInsight" accountId={accountId} />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-background px-6 pb-20">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <AccountCard account={account} />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRecategorize} 
            disabled={recategorizing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${recategorizing ? 'animate-spin' : ''}`} />
            {recategorizing ? 'Categorizing...' : 'Re-categorize'}
          </Button>
        </div>
        
        <FinancialInsightContent accountId={accountId} />
      </div>
    </div>
  );
};

export default AccountDetail;
