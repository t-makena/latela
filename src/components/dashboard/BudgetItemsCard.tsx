import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { AddBudgetItemDialog } from '@/components/budget/AddBudgetItemDialog';
import { useBudgetItems } from '@/hooks/useBudgetItems';
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

export const BudgetItemsCard = () => {
  const isMobile = useIsMobile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { budgetItems, loading, calculateMonthlyAmount, calculateTotalMonthly, addBudgetItem, deleteBudgetItem } = useBudgetItems();

  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Budget Items</CardTitle>
          <Button
            size="icon"
            onClick={() => setDialogOpen(true)}
            className="rounded-full"
          >
            <Plus className="h-5 w-5" />
          </Button>
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
              <p>No budget items yet</p>
              <p className="text-sm mt-2">Click the + button to add your first budget item</p>
            </div>
          ) : (
            <div className={isMobile ? "overflow-x-auto" : ""}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category/Merchant</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        {item.frequency}
                        {item.frequency === 'Daily' && item.days_per_week && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({item.days_per_week}x/week)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(calculateMonthlyAmount(item))}
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
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(calculateTotalMonthly())}
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
