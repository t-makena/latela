
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Wallet, Calendar, Settings, Menu, TrendingUp, Target, LogOut, PanelLeftClose } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import latelaLogo from "@/assets/latela-logo.png";

const navItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Accounts", href: "/accounts", icon: Wallet },
  { name: "Financial Insight", href: "/financial-insight", icon: TrendingUp },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const Navbar = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out");
    } else {
      toast.success("Logged out successfully");
      navigate("/auth");
    }
  };
  
  const NavContent = ({ showLabels = true }: { showLabels?: boolean }) => (
    <div className={cn("flex flex-col gap-2", showLabels ? "px-2" : "")}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link to={item.href} key={item.name}>
            {showLabels ? (
              <Button
                variant={isActive ? "default" : "ghost"}
                size="lg"
                className={cn(
                  "w-full gap-3 transition-all justify-start text-base h-12",
                  isActive ? "bg-primary text-primary-foreground" : ""
                )}
              >
                <item.icon size={22} className="shrink-0" />
                <span className="truncate">{item.name}</span>
              </Button>
            ) : (
              <div className={cn(
                "w-full flex items-center justify-center py-4 transition-colors cursor-pointer rounded-md",
                isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
              )}>
                <item.icon size={22} className="shrink-0" />
              </div>
            )}
          </Link>
        );
      })}
      {showLabels ? (
        <Button
          variant="ghost"
          size="lg"
          onClick={handleLogout}
          className="w-full gap-3 text-base h-12 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all mt-auto justify-start"
        >
          <LogOut size={22} className="shrink-0" />
          <span className="truncate">Log Out</span>
        </Button>
      ) : (
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center py-4 text-destructive hover:text-destructive/80 transition-colors mt-auto cursor-pointer"
        >
          <LogOut size={22} className="shrink-0" />
        </button>
      )}
    </div>
  );

  return (
    <>
      {isMobile ? (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-2xl font-bold">Latela</h1>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col items-center mb-6 pt-4">
                  <h2 className="text-2xl font-bold">Latela</h2>
                </div>
                <div className="py-2">
                  <NavContent showLabels={true} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      ) : (
        <div 
          className={cn(
            "h-full transition-all duration-300 ease-in-out relative",
            isExpanded ? "w-64 p-2" : "w-16 py-2"
          )}
        >
          {/* Toggle Button / Logo */}
          <div className={cn(
            "flex items-center mb-6",
            isExpanded ? "justify-between px-2" : "justify-center"
          )}>
            {isExpanded ? (
              <>
                <h2 className="text-2xl font-bold">Latela</h2>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="shrink-0"
                >
                  <PanelLeftClose size={20} />
                </Button>
              </>
            ) : (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-center hover:opacity-80 transition-opacity p-2"
              >
                <img src={latelaLogo} alt="Latela" className="h-12 w-12" />
              </button>
            )}
          </div>
          
          <div className="flex flex-col h-[calc(100%-4rem)]">
            <NavContent showLabels={isExpanded} />
          </div>
        </div>
      )}
    </>
  );
};
