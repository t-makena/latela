import { Card, CardContent } from "@/components/ui/card";
import { AccountType } from "@/lib/data";
import { AspectRatio } from "@/components/ui/aspect-ratio";

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
    <div className="max-w-md mx-auto">
      <AspectRatio ratio={85.6 / 53.98}>
        <Card className="rounded-3xl border border-border shadow-lg bg-card hover:shadow-xl transition-shadow h-full">
          <CardContent className="p-6 h-full flex flex-col justify-between">
            {/* EMV Chip and Bank Name/Logo */}
            <div className="flex items-start justify-between gap-3">
              {/* Left side: EMV Chip and Bank info */}
              <div className="flex items-center gap-3">
                {/* EMV Chip Icon */}
                <div className="h-10 w-12 bg-gradient-to-br from-yellow-200 via-yellow-100 to-yellow-300 rounded-md flex-shrink-0 relative overflow-hidden border border-yellow-400/50">
                  <svg viewBox="0 0 48 40" className="w-full h-full p-1">
                    <rect x="4" y="4" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-yellow-800/30" />
                    <rect x="18" y="4" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-yellow-800/30" />
                    <rect x="32" y="4" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-yellow-800/30" />
                    <rect x="4" y="18" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-yellow-800/30" />
                    <rect x="18" y="18" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-yellow-800/30" />
                    <rect x="32" y="18" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-yellow-800/30" />
                  </svg>
                </div>
                
                <div className="h-10 w-10 bg-foreground rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-background font-bold text-lg">
                    {account.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground leading-tight">
                    {account.name}
                  </h2>
                </div>
              </div>
            </div>

            {/* Balance Information and Card Logo */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Budget Balance</p>
                <p className="text-3xl font-bold text-foreground leading-none mb-1">
                  R{account.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Available Balance: R{account.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* Card Network Logo (Mastercard style) */}
              <div className="h-10 w-14 bg-foreground rounded-xl flex items-center justify-center flex-shrink-0">
                <div className="flex items-center">
                  <div className="h-7 w-7 rounded-full bg-[#eb001b]"></div>
                  <div className="h-7 w-7 rounded-full bg-[#f79e1b] -ml-3"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </AspectRatio>

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
    </div>
  );
};
