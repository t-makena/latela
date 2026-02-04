import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { AddBudgetItemDialog } from '@/components/budget/AddBudgetItemDialog';
import { useBudgetItems } from '@/hooks/useBudgetItems';
import { useTransactions } from '@/hooks/useTransactions';
import { useSubcategories } from '@/hooks/useSubcategories';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/hooks/useLanguage';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const BudgetItemsCard = () => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const { budgetItems, loading, calculateMonthlyAmount, calculateTotalMonthly, addBudgetItem, deleteBudgetItem, refetch } = useBudgetItems();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { subcategories, loading: categoriesLoading } = useSubcategories();

  const handleScanForDebitOrders = async () => {
    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('detect-recurring-transactions', {
        body: { lookbackMonths: 6 }
      });

      if (error) throw error;

      if (data.added > 0) {
        toast({
          title: t('common.success'),
          description: `Added ${data.added} detected debit order${data.added > 1 ? 's' : ''} to your budget.`,
        });
        refetch();
      } else {
        toast({
          title: 'No new debit orders found',
          description: 'All detected recurring transactions are already in your budget.',
        });
      }
    } catch (error) {
      console.error('Error scanning for debit orders:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to scan for debit orders. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };
  // Function to get display name (custom name if category has been replaced)
  const getDisplayName = (itemName: string) => {
    // Find a custom category that replaced a system category with this name
    const replacedCategory = subcategories.find(
      (sub) => sub.is_custom && sub.original_name === itemName
    );
    
    if (replacedCategory) {
      return replacedCategory.name;
    }
    
    return itemName;
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  // Calculate amount spent for each budget item by matching category or description
  const calculateAmountSpent = useMemo(() => {
    if (transactionsLoading || !transactions) return {};

    const spentByItem: Record<string, number> = {};

    budgetItems.forEach((item) => {
      const itemNameLower = item.name.toLowerCase();
      
      const matchingTransactions = transactions.filter((t) => {
        // Match by parent category name
        if (t.parent_category_name?.toLowerCase() === itemNameLower) return true;
        // Match by subcategory name
        if (t.subcategory_name?.toLowerCase() === itemNameLower) return true;
        // Match by display subcategory name (custom categories)
        if (t.display_subcategory_name?.toLowerCase() === itemNameLower) return true;
        // Match by merchant name
        if (t.merchant_name?.toLowerCase().includes(itemNameLower)) return true;
        // Fallback: match by description
        if (t.description?.toLowerCase().includes(itemNameLower)) return true;
        return false;
      });
      
      const totalSpent = matchingTransactions.reduce((sum, t) => {
        // Only count expenses (negative amounts or DR transaction code)
        if (t.amount < 0 || t.transaction_code === 'DR') {
          return sum + Math.abs(t.amount);
        }
        return sum;
      }, 0);
      
      spentByItem[item.id] = totalSpent;
    });

    return spentByItem;
  }, [budgetItems, transactions, transactionsLoading]);

  const totalAmountSpent = useMemo(() => {
    return Object.values(calculateAmountSpent).reduce((sum, amount) => sum + amount, 0);
  }, [calculateAmountSpent]);

  return (
    <>
      <Card className="h-full">
        <CardHeader className="flex flex-row items-start justify-between pt-4 pb-4">
          <CardTitle className="heading-main">{t('finance.budgetPlan')}</CardTitle>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={handleScanForDebitOrders}
              disabled={isScanning}
              className="rounded-full"
              title="Scan for debit orders"
            >
              <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="icon"
              onClick={() => setDialogOpen(true)}
              className="rounded-full"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : budgetItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t('finance.noBudgetItemsYet')}</p>
              <p className="text-sm mt-2">{t('finance.clickPlusToAdd')}</p>
            </div>
          ) : (
            <div className={isMobile ? "overflow-x-auto" : ""}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('finance.categoryMerchant')}</TableHead>
                    <TableHead>{t('budget.frequency')}</TableHead>
                    <TableHead className="text-right">{t('budget.amount')}</TableHead>
                    <TableHead className="text-right">{t('budget.freqBudget')}</TableHead>
                    <TableHead className="text-right">{t('finance.amountSpent')}</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getDisplayName(item.name)}
                          {item.auto_detected && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              Auto
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {t(`budget.${item.frequency.toLowerCase().replace('-', '')}`)}
                        {item.frequency === 'Daily' && item.days_per_week && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({item.days_per_week}x/{t('budget.weekly').toLowerCase().slice(0, 4)})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(calculateMonthlyAmount(item))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(calculateAmountSpent[item.id] || 0)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteBudgetItem(item.id)}
                          className="h-8 w-8 hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={3}>{t('common.total')}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(calculateTotalMonthly())}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totalAmountSpent)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddBudgetItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={addBudgetItem}
      />
    </>
  );
};
