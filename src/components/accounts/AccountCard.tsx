import { Card, CardContent } from "@/components/ui/card";
import { AccountType } from "@/lib/data";

interface AccountCardProps {
  account: AccountType;
  accounts?: AccountType[];
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  showPagination?: boolean;
}

export const AccountCard = ({ 
  account, 
  accounts = [], 
  currentIndex = 0, 
  onIndexChange,
  showPagination = false 
}: AccountCardProps) => {
  return (
    <Card className="rounded-3xl border border-border shadow-lg bg-muted/30">
      <CardContent className="p-6">
        {/* Bank Name with Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-9 w-12 bg-foreground rounded-lg flex items-center justify-center">
            <span className="text-background font-bold text-lg">
              {account.name.charAt(0)}
            </span>
          </div>
          <h2 className="text-base font-bold text-foreground">{account.name}</h2>
        </div>

        {/* Budget Balance */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Budget Balance</p>
            <p className="text-4xl font-bold text-foreground">
              R{account.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Available Balance: R{account.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
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
        {showPagination && accounts.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-4">
            {accounts.map((_, index) => (
              <button
                key={index}
                onClick={() => onIndexChange?.(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'w-6 bg-foreground' 
                    : 'w-1.5 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
