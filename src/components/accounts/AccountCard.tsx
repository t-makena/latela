import { Card, CardContent } from "@/components/ui/card";
import { AccountType } from "@/lib/data";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  
  return (
    <Card className="rounded-3xl bg-card border border-foreground">
      <CardContent className="p-6">
        {/* Bank Name, Logo and Account Number */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 bg-foreground rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-background font-bold text-xl">
              {account.name.charAt(0)}
            </span>
          </div>
          <div>
            <h2 className="heading-card leading-tight">
              {account.name}
            </h2>
          </div>
        </div>

        {/* Balance Information and Card Logo */}
        <div className="flex items-end justify-between">
          <div>
            <p className="transaction-description mb-2">Available Balance</p>
            <p className="heading-card leading-none currency">
              R{account.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Card Network Logo (Mastercard style) */}
          <div className="h-14 w-20 bg-foreground rounded-xl flex items-center justify-center flex-shrink-0">
            <div className="flex items-center">
              <div className="h-9 w-9 rounded-full bg-[#eb001b]"></div>
              <div className="h-9 w-9 rounded-full bg-[#f79e1b] -ml-4"></div>
            </div>
          </div>
        </div>

        {/* Pagination Dots */}
        {showPagination && accounts.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-6">
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
