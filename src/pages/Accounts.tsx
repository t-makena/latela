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

const Accounts = () => {
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Mock data
  const accounts = [
    {
      id: 1,
      bankName: "Nedbank Bank Cheque Account",
      balance: 103779.00,
      logo: "N",
      paymentProvider: "mastercard"
    }
  ];

  const transactions = [
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

  const currentAccount = accounts[currentAccountIndex];

  // Filter transactions based on selected category
  const filteredTransactions = selectedCategory 
    ? transactions.filter(t => t.category === selectedCategory)
    : transactions;

  const handleCategoryClick = (category: string) => {
    // Toggle: if same category is clicked, clear the filter
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 pb-20 space-y-6">
        {/* Account Card */}
        <Card className="rounded-3xl border border-border shadow-lg bg-muted/30">
          <CardContent className="p-6">
            {/* Bank Name with Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-12 bg-foreground rounded-lg flex items-center justify-center">
                <span className="text-background font-bold text-lg">{currentAccount.logo}</span>
              </div>
              <h2 className="text-base font-bold text-foreground">{currentAccount.bankName}</h2>
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
            {selectedCategory && (
              <button 
                onClick={() => setSelectedCategory(null)}
                className="text-xs text-muted-foreground underline"
              >
                Clear filter
              </button>
            )}
          </div>
          
          <div className="space-y-0 border-t border-border">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="py-4 border-b border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge 
                      variant="secondary" 
                      className={`mb-2 text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 ${transaction.categoryColor} ${selectedCategory === transaction.category ? 'ring-2 ring-foreground' : ''}`}
                      onClick={() => handleCategoryClick(transaction.category)}
                    >
                      {transaction.category}
                    </Badge>
                    <p className="font-semibold text-foreground text-base mb-1">
                      {transaction.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.date}
                    </p>
                  </div>
                  <p className="text-destructive font-bold text-base">
                    -R{Math.abs(transaction.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button className="text-sm text-foreground underline mt-3 font-medium">
            see more
          </button>
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

      </div>
    </div>
  );
};

export default Accounts;
