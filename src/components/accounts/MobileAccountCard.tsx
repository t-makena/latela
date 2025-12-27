import { AccountType } from "@/lib/data";

interface MobileAccountCardProps {
  account: AccountType;
}

export const MobileAccountCard = ({ account }: MobileAccountCardProps) => {
  return (
    <div className="animate-fade-in w-full">
      <div 
        className="bg-card rounded-3xl border border-foreground p-5 flex justify-between items-start"
      >
        {/* Left Side Content */}
        <div>
          <p className="heading-card">{account.name}</p>
          <p className="transaction-description mt-1">Available balance</p>
          <p className="heading-card mt-1 currency">
            R{account.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        
        {/* Right Side - Bank logos stacked */}
        <div className="flex flex-col items-end justify-between h-full gap-3">
          {/* Top logo - abstract swoosh/bank initial */}
          <div className="w-10 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {account.name.charAt(0)}
            </span>
          </div>
          {/* Bottom - Mastercard logo */}
          <div className="flex items-center">
            <div className="h-6 w-6 rounded-full bg-[#eb001b]" />
            <div className="h-6 w-6 rounded-full bg-[#f79e1b] -ml-2" />
          </div>
        </div>
      </div>
    </div>
  );
};
