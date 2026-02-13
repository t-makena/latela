import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ShoppingCart, ChevronRight, ArrowLeft, Search } from 'lucide-react';
import { AddBudgetItemDialog } from '@/components/budget/AddBudgetItemDialog';
import { BudgetMethodCard } from '@/components/budget/BudgetMethodCard';
import { useBudgetItems } from '@/hooks/useBudgetItems';
import { useGoals } from '@/hooks/useGoals';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useSubcategories } from '@/hooks/useSubcategories';
import { useBudgetMethod } from '@/hooks/useBudgetMethod';
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
import { useGroceryCart } from '@/hooks/useGroceryCart';
import { SearchProduct, ProductOffer } from '@/hooks/usePriceSearch';
import { SearchTab } from '@/components/grocery-budget/SearchTab';
import { MyListTab } from '@/components/grocery-budget/MyListTab';
import { formatPriceCents } from '@/lib/storeColors';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

type GroceryTabType = 'search' | 'list';

const Budget = () => {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [view, setView] = useState<'budget' | 'grocery'>('budget');
  const [groceryTab, setGroceryTab] = useState<GroceryTabType>('search');
  const currentDate = new Date();
  const { t } = useLanguage();

  // Read URL search params on mount for deep link support
  useEffect(() => {
    const viewParam = searchParams.get('view');
    const tabParam = searchParams.get('tab');
    if (viewParam === 'grocery') {
      setView('grocery');
      if (tabParam === 'list') {
        setGroceryTab('list');
      }
      // Clean up URL params
      setSearchParams({}, { replace: true });
    }
  }, []);

  const {
    items: groceryItems,
    addToCart,
    updateQuantity,
    updateStore,
    removeFromCart,
    clearCart,
    itemCount: groceryItemCount,
    totalCents: groceryTotalCents,
  } = useGroceryCart();

  const handleAddToCart = (product: SearchProduct, selectedOffer?: ProductOffer) => {
    addToCart({
      productId: product.id,
      productName: product.name,
      brand: product.brand,
      imageUrl: product.image_url,
      quantityValue: product.quantity_value,
      quantityUnit: product.quantity_unit,
      offers: product.offers,
      selectedOffer,
    });
    toast.success(t('groceryBudget.addedToList'));
  };

  const handleAddScannedItems = (scannedItems: Array<{
    productId: string;
    productName: string;
    brand: string | null;
    imageUrl: string | null;
    quantityValue: number | null;
    quantityUnit: string | null;
    offers: Array<{
      store: string;
      store_display_name: string;
      price_cents: number;
      unit_price_cents: number | null;
      in_stock: boolean;
      on_sale: boolean;
      promotion_text: string | null;
      product_url: string | null;
    }>;
  }>) => {
    scannedItems.forEach(item => {
      addToCart({
        productId: item.productId,
        productName: item.productName,
        brand: item.brand,
        imageUrl: item.imageUrl,
        quantityValue: item.quantityValue,
        quantityUnit: item.quantityUnit,
        offers: item.offers,
      });
    });
  };
  const { budgetItems, loading, calculateMonthlyAmount, calculateTotalMonthly, addBudgetItem, deleteBudgetItem } = useBudgetItems();
  const { goals, loading: goalsLoading } = useGoals();
  const { upcomingEvents, isLoading: eventsLoading } = useCalendarEvents({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1
  });
  const { accounts, loading: accountsLoading } = useAccounts();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { subcategories, loading: categoriesLoading } = useSubcategories();
  const { 
    budgetMethod, 
    loading: budgetMethodLoading,
    calculateCategoryAllocations,
    needsPercentage,
    wantsPercentage,
    savingsPercentage,
    updateBudgetMethod,
    updatePercentages,
  } = useBudgetMethod();

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

  const totalSavingGoals = goals.reduce((sum, goal) => sum + goal.amountSaved, 0);
  const totalBudgetExpenses = calculateTotalMonthly();
  const totalUpcomingEvents = upcomingEvents.reduce((sum, event) => sum + event.budgetedAmount, 0);

  const availableBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const budgetBalanceValue = totalBudgetExpenses + totalUpcomingEvents;
  const flexibleBalance = availableBalance - totalSavingGoals - budgetBalanceValue;

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

  const isLoading = loading || goalsLoading || eventsLoading || accountsLoading || budgetMethodLoading;

  // Check if we should show balance calculations (only for percentage-based budgeting)
  const showBalanceCalculations = budgetMethod === 'percentage_based';

  // Calculate category allocations for percentage-based budgeting
  const categoryAllocations = useMemo(() => {
    if (budgetMethod !== 'percentage_based') return undefined;
    
    // Map budget items to include parent_category_id from subcategories
    const itemsWithCategories = budgetItems.map(item => {
      const subcategory = subcategories.find(sub => sub.name === item.name);
      // Use type assertion since parent_category_id may not be in the type yet (pending migration)
      const existingParentId = (item as { parent_category_id?: string }).parent_category_id;
      return {
        ...item,
        parent_category_id: existingParentId || subcategory?.parent_category_id || undefined,
      };
    });

    return calculateCategoryAllocations(availableBalance, itemsWithCategories, calculateMonthlyAmount);
  }, [budgetMethod, budgetItems, subcategories, availableBalance, calculateCategoryAllocations, calculateMonthlyAmount]);

  // Wrapper for addBudgetItem that handles the optional parentCategoryId
  const handleAddBudgetItem = async (
    name: string,
    frequency: string,
    amount: number,
    daysPerWeek?: number,
    _parentCategoryId?: string
  ) => {
    await addBudgetItem(name, frequency, amount, daysPerWeek);
  };

  // Grocery sub-view content
  const GrocerySubView = () => (
    <div className="flex flex-col min-h-full pb-20">
      {/* Back Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setView('budget')}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t('groceryBudget.title')}</h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setGroceryTab('search')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors border-2",
            groceryTab === 'search'
              ? "bg-foreground text-background border-foreground"
              : "bg-background text-foreground border-foreground hover:bg-accent"
          )}
        >
          <Search size={18} />
          {t('groceryBudget.searchTab')}
        </button>
        <button
          onClick={() => setGroceryTab('list')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors border-2",
            groceryTab === 'list'
              ? "bg-foreground text-background border-foreground"
              : "bg-background text-foreground border-foreground hover:bg-accent"
          )}
        >
          <ShoppingCart size={18} />
          {t('groceryBudget.myListTab')} ({groceryItemCount})
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {groceryTab === 'search' ? (
          <SearchTab onAddToCart={handleAddToCart} />
        ) : (
          <MyListTab
            items={groceryItems}
            onUpdateQuantity={updateQuantity}
            onUpdateStore={updateStore}
            onRemove={removeFromCart}
            onClearCart={clearCart}
            onAddScannedItems={handleAddScannedItems}
          />
        )}
      </div>

      {/* Sticky Footer */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-background border-t-2 border-foreground py-4 px-6",
          isMobile ? "" : "ml-24 lg:ml-64"
        )}
        style={{ boxShadow: '0 -4px 0px 0px rgba(0,0,0,1)' }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {groceryItemCount === 0 ? (
            <span className="text-muted-foreground">
              {t('groceryBudget.estMonthlyBudget')}: R0.00
            </span>
          ) : (
            <span className="font-semibold">
              {t('groceryBudget.itemsTotal').replace('{{count}}', groceryItemCount.toString())}: {formatPriceCents(groceryTotalCents)}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Grocery Budget Navigation Card
  const GroceryNavCard = () => (
    <div
      onClick={() => setView('grocery')}
      className="bg-card rounded-2xl border border-foreground p-5 cursor-pointer hover:bg-accent/50 transition-colors"
      style={{ boxShadow: '4px 4px 0px #000000' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6" />
          <div>
            <h3 className="font-bold text-base">{t('groceryBudget.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('groceryBudget.searchTab')} & {t('groceryBudget.myListTab')}</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  );

  // Mobile layout - separate path without container wrapper
  if (isMobile) {
    if (view === 'grocery') {
      return <div className="min-h-screen py-6 animate-fade-in"><GrocerySubView /></div>;
    }

    return (
      <div className="min-h-screen py-6 space-y-5 animate-fade-in">
        {/* Budget Method Card - Now first */}
        <BudgetMethodCard
          budgetMethod={budgetMethod}
          needsPercentage={needsPercentage}
          wantsPercentage={wantsPercentage}
          savingsPercentage={savingsPercentage}
          loading={budgetMethodLoading}
          onUpdateBudgetMethod={updateBudgetMethod}
          onUpdatePercentages={updatePercentages}
        />

        {/* Budget Plan Card */}
        <div 
          className="bg-card rounded-3xl border border-foreground p-5 w-full"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-main">{t('finance.budgetPlan')}</h2>
            <Button
              size="icon"
              onClick={() => setDialogOpen(true)}
              className="rounded-full h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : budgetItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No budget items yet</p>
              <p className="text-sm mt-2">Tap + to add your first item</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 table-header-text">{t('finance.category')}:</th>
                  <th className="text-right py-2 table-header-text">{t('finance.amountSpent')}:</th>
                </tr>
              </thead>
              <tbody>
                {budgetItems.map((item) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="py-3 table-body-text font-medium">{getDisplayName(item.name)}</td>
                    <td className="py-3 table-body-text text-right">
                      <span className={`currency ${
                        (calculateAmountSpent[item.id] || 0) > calculateMonthlyAmount(item)
                          ? 'text-negative font-semibold'
                          : 'text-positive'
                      }`}>
                        {formatCurrency(calculateAmountSpent[item.id] || 0)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Balance Calculations Card - Only show for percentage-based budgeting */}
        {showBalanceCalculations && (
          <div 
            className="bg-card rounded-3xl border border-foreground p-5 w-full animate-scale-fade-in"
          >
            <h2 className="heading-main mb-4">{t('budget.balanceCalculations')}</h2>
            
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3 table-body-text">
                <div className="flex justify-between items-center">
                  <span className="label-text">{t('budget.plannedExpenses')}</span>
                  <span className="currency">{formatCurrency(totalBudgetExpenses)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="label-text">{t('budget.upcomingEvents')}</span>
                  <span className="currency">{formatCurrency(totalUpcomingEvents)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="font-bold">{t('finance.budgetBalance')}</span>
                  <span className="font-bold currency">{formatCurrency(budgetBalanceValue)}</span>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <span className="label-text">{t('finance.availableBalance')}</span>
                  <span className="currency">{formatCurrency(availableBalance)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="label-text">{t('budget.savingsGoals')}</span>
                  <span className="currency">-{formatCurrency(totalSavingGoals)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="label-text">{t('finance.budgetBalance')}</span>
                  <span className="currency">-{formatCurrency(budgetBalanceValue)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="font-bold">{t('finance.flexibleBalance')}</span>
                  <span className="font-bold currency">{flexibleBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(flexibleBalance))}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Grocery Budget Navigation Card */}
        <GroceryNavCard />

        <AddBudgetItemDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onAdd={handleAddBudgetItem}
          budgetMethod={budgetMethod}
          categoryAllocations={categoryAllocations}
          availableBalance={availableBalance}
        />
      </div>
    );
  }

  // Desktop layout
  if (view === 'grocery') {
    return (
      <div className="container mx-auto p-6 animate-fade-in">
        <GrocerySubView />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Budget Method + Budget Plan */}
        <div className={`${showBalanceCalculations ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
          {/* Budget Method Card */}
          <BudgetMethodCard
            budgetMethod={budgetMethod}
            needsPercentage={needsPercentage}
            wantsPercentage={wantsPercentage}
            savingsPercentage={savingsPercentage}
            loading={budgetMethodLoading}
            onUpdateBudgetMethod={updateBudgetMethod}
            onUpdatePercentages={updatePercentages}
          />

          {/* Main Budget Items Table */}
          <Card className="w-full bg-card border border-foreground">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="heading-main">{t('finance.budgetPlan')}</CardTitle>
              <Button
                size="icon"
                onClick={() => setDialogOpen(true)}
                className="rounded-full"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : budgetItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No budget items yet</p>
                  <p className="text-sm mt-2">Click the + button to add your first budget item</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="table-header-text">Category/Merchant</TableHead>
                      <TableHead className="table-header-text">Frequency</TableHead>
                      <TableHead className="text-right table-header-text">Budget</TableHead>
                      <TableHead className="text-right table-header-text">Freq x Budget</TableHead>
                      <TableHead className="text-right table-header-text">Amount Spent</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="table-body-text font-medium">{getDisplayName(item.name)}</TableCell>
                        <TableCell className="table-body-text">
                          {item.frequency}
                          {item.frequency === 'Daily' && item.days_per_week && (
                            <span className="text-transaction-date text-text-muted ml-1">
                              ({item.days_per_week}x/week)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right table-body-text currency">
                          {formatCurrency(item.amount)}
                        </TableCell>
                        <TableCell className="text-right table-body-text currency">
                          {formatCurrency(calculateMonthlyAmount(item))}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`table-body-text currency ${
                            (calculateAmountSpent[item.id] || 0) > calculateMonthlyAmount(item)
                              ? 'text-negative font-semibold'
                              : 'text-positive'
                          }`}>
                            {formatCurrency(calculateAmountSpent[item.id] || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteBudgetItem(item.id)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell colSpan={3} className="table-body-text font-bold">Total</TableCell>
                      <TableCell className="text-right table-body-text font-bold currency">
                        {formatCurrency(totalBudgetExpenses)}
                      </TableCell>
                      <TableCell className="text-right table-body-text font-bold currency">
                        {formatCurrency(totalAmountSpent)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar Cards */}
        {showBalanceCalculations && (
          <div className="space-y-6 w-full animate-scale-fade-in">
            {/* Balance Calculations Card */}
            <Card className="w-full bg-card border border-foreground">
              <CardHeader>
                <CardTitle className="heading-main">{t('budget.balanceCalculations')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <>
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="label-text">Planned expenses</span>
                      <span className="table-body-text currency">{formatCurrency(totalBudgetExpenses)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="label-text">Upcoming events</span>
                      <span className="table-body-text currency">{formatCurrency(totalUpcomingEvents)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="table-body-text font-bold">Budget Balance</span>
                      <span className="table-body-text font-bold currency">{formatCurrency(budgetBalanceValue)}</span>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="label-text">Available Balance</span>
                      <span className="table-body-text currency">{formatCurrency(availableBalance)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="label-text">Savings Goals</span>
                      <span className="table-body-text currency">-{formatCurrency(totalSavingGoals)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="label-text">Budget Balance</span>
                      <span className="table-body-text currency">-{formatCurrency(budgetBalanceValue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="table-body-text font-bold">Flexible Balance</span>
                      <span className="table-body-text font-bold currency">{flexibleBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(flexibleBalance))}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Calculation Explanation Card */}
            <Card className="w-full bg-card border border-foreground">
              <CardHeader>
                <CardTitle className="heading-card">Calculation Explanation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p><span className="font-semibold text-foreground">Monthly:</span> Amount × 1</p>
                <p><span className="font-semibold text-foreground">Weekly:</span> Amount × 4</p>
                <p><span className="font-semibold text-foreground">Bi-weekly:</span> Amount × 2</p>
                <p><span className="font-semibold text-foreground">Daily:</span> Amount × 4</p>
                <p><span className="font-semibold text-foreground">Once-off:</span> Amount × 1</p>
              </CardContent>
            </Card>

            {/* Grocery Budget Navigation Card */}
            <GroceryNavCard />
          </div>
        )}
      </div>

      {/* Grocery Nav Card when no sidebar */}
      {!showBalanceCalculations && (
        <div className="mt-6">
          <GroceryNavCard />
        </div>
      )}

      <AddBudgetItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAddBudgetItem}
        budgetMethod={budgetMethod}
        categoryAllocations={categoryAllocations}
        availableBalance={availableBalance}
      />
    </div>
  );
};

export default Budget;
