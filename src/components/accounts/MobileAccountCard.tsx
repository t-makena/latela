import { AccountType } from "@/lib/data";

interface MobileAccountCardProps {
  account: AccountType;
}

export const MobileAccountCard = ({ account }: MobileAccountCardProps) => {
  return (
    <div className="animate-fade-in w-full">
      <div 
        className="bg-white rounded-2xl border border-black p-4 flex justify-between items-start"
        style={{ boxShadow: '3px 3px 0px #000000' }}
      >
        {/* Left Side Content */}
        <div>
          <p className="font-bold text-lg text-black">{account.name}</p>
          <p className="text-sm font-light text-[#999999] mt-1">Available balance</p>
          <p className="text-xl text-black mt-1 font-georama">
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
