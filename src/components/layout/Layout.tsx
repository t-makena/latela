import { useState } from "react";
import { Navbar } from "./Navbar";
import { useIsMobile } from "@/hooks/use-mobile";
import piggyBankDoodle from "@/assets/piggy-bank-doodle.png";
import budgetChartDoodle from "@/assets/budget-chart-doodle.png";
import happyMoneyDoodle from "@/assets/happy-money-doodle.png";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen relative">
      {/* Fun doodles positioned absolutely in background */}
      <img 
        src={piggyBankDoodle} 
        alt="" 
        className="absolute top-4 right-4 w-12 h-12 opacity-10 pointer-events-none z-0 hidden lg:block" 
      />
      <img 
        src={happyMoneyDoodle} 
        alt="" 
        className="absolute bottom-20 right-8 w-14 h-14 opacity-15 pointer-events-none z-0 hidden lg:block" 
      />
      
      <div className={`container mx-auto flex h-full min-h-screen flex-col md:flex-row ${isMobile ? 'p-0' : 'p-2 md:p-4'} relative z-10 gap-4`}>
        {!isMobile && (
          <div className="sticky top-0 h-screen">
            <Navbar />
          </div>
        )}
        <main className={`flex-1 overflow-y-auto ${isMobile ? 'px-3 pt-3' : ''}`}>
          {children}
        </main>
        {isMobile && <Navbar />}
      </div>
    </div>
  );
};
