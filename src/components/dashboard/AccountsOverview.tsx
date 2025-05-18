
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { accounts, formatCurrency } from "@/lib/data";
import { ChevronRight } from "lucide-react";

export const AccountsOverview = () => {
  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Accounts</CardTitle>
          <Link to="/accounts">
            <Button variant="ghost" size="sm" className="gap-1">
              See all <ChevronRight size={16} />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors">
              <div className="flex items-center gap-3">
                <div 
                  className="h-8 w-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: account.color }}
                >
                  <span className="text-white font-medium text-sm">
                    {account.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {account.type}
                  </p>
                </div>
              </div>
              <div className={`font-bold ${account.balance < 0 ? 'text-destructive' : ''}`}>
                {formatCurrency(account.balance)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
