import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { format } from "date-fns";
import { EditTransactionDialog } from "./EditTransactionDialog";

interface Transaction {
  id: string;
  transaction_date: string;
  description: string;
  category_id: string | null;
  account_id: string;
  amount: number;
  transaction_code: string;
  balance: number;
  cleared: boolean;
  created_at: string;
  reference: string;
  merchant_id: string | null;
  merchant_name: string | null;
  parent_category_name: string | null;
  parent_category_color: string | null;
  display_subcategory_name: string | null;
  display_subcategory_color: string | null;
}

interface Account {
  id: string;
  account_number: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Merchant {
  id: string;
  merchant_name: string;
}

interface TransactionHistoryProps {
  initialCategoryFilterName?: string;
}

export const TransactionHistory = ({ initialCategoryFilterName }: TransactionHistoryProps = {}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMerchant, setSelectedMerchant] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("1m");
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Update category filter when initialCategoryFilterName changes
  useEffect(() => {
    if (initialCategoryFilterName && categories.length > 0) {
      const matchingCategory = categories.find(c => c.name === initialCategoryFilterName);
      if (matchingCategory) {
        setSelectedCategory(matchingCategory.id);
      }
    }
  }, [initialCategoryFilterName, categories]);

  useEffect(() => {
    fetchData();
  }, [selectedAccount, selectedCategory, selectedMerchant, selectedPeriod]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch accounts
      const { data: accountsData } = await supabase
        .from('accounts')
        .select('id, account_number');
      setAccounts((accountsData as any) || []);

      // Fetch categories - bypass type checking
      const { data: categoriesData, error: catError } = await (supabase as any)
        .from('categories')
        .select('id, name, color');
      
      if (!catError && categoriesData) {
        setCategories(categoriesData);
      }

      // Fetch merchants
      const { data: merchantsData } = await supabase
        .from('merchants')
        .select('id, merchant_name')
        .order('merchant_name');
      setMerchants((merchantsData as any) || []);

      // Build transaction query using the view with all related data
      let query: any = supabase
        .from('v_transactions_with_details')
        .select('*')
        .order('transaction_date', { ascending: false })
        .limit(20);

      // Apply filters
      if (selectedAccount !== "all") {
        query = query.eq('account_id', selectedAccount);
      }
      if (selectedCategory !== "all") {
        query = query.eq('category_id', selectedCategory);
      }
      if (selectedMerchant !== "all") {
        query = query.eq('merchant_id', selectedMerchant);
      }

      // Apply period filter
      const now = new Date();
      let startDate = new Date();
      switch (selectedPeriod) {
        case "1w":
          startDate.setDate(now.getDate() - 7);
          break;
        case "1m":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "3m":
          startDate.setMonth(now.getMonth() - 3);
          break;
        case "6m":
          startDate.setMonth(now.getMonth() - 6);
          break;
        case "1y":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case "all":
          startDate = new Date(0);
          break;
      }
      
      if (selectedPeriod !== "all") {
        query = query.gte('transaction_date', startDate.toISOString());
      }

      const { data: transactionsData } = await query;
      if (transactionsData) {
        setTransactions(transactionsData as any);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (transaction: Transaction) => {
    return transaction.display_subcategory_name || transaction.parent_category_name || "Uncategorized";
  };

  const getCategoryColor = (transaction: Transaction) => {
    return transaction.display_subcategory_color || transaction.parent_category_color || "#6B7280";
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? `Account ${account.account_number}` : "Unknown";
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">Transaction History</h2>
          <p className="text-xs text-muted-foreground">
            {loading ? "Loading..." : `Showing ${transactions.length} transactions`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Account</label>
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map(account => (
                <SelectItem key={account.id} value={account.id}>
                  Account {account.account_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Merchant</label>
          <Select value={selectedMerchant} onValueChange={setSelectedMerchant}>
            <SelectTrigger>
              <SelectValue placeholder="Select merchant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Merchants</SelectItem>
              {merchants.map(merchant => (
                <SelectItem key={merchant.id} value={merchant.id}>
                  {merchant.merchant_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Period</label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1w">1 Week</SelectItem>
              <SelectItem value="1m">1 Month</SelectItem>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No transactions found for the selected filters
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(transaction.transaction_date), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {transaction.description || "No description"}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {transaction.merchant_name || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      style={{ 
                        backgroundColor: `${getCategoryColor(transaction)}20`,
                        color: getCategoryColor(transaction),
                        border: `1px solid ${getCategoryColor(transaction)}`
                      }}
                    >
                      {getCategoryName(transaction)}
                    </Badge>
                  </TableCell>
                  <TableCell>{getAccountName(transaction.account_id)}</TableCell>
                  <TableCell className={`text-right font-semibold ${
                    transaction.transaction_code === 'DR' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {transaction.transaction_code === 'DR' ? '-' : '+'}R{Math.abs(transaction.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTransaction(transaction)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedTransaction && (
        <EditTransactionDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          transaction={selectedTransaction}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};
