
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Wallet, Calendar, Settings, Menu, TrendingUp, Target, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

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
      navigate("/");
    }
  };
  
  const NavContent = ({ showLabels = true }: { showLabels?: boolean }) => (
    <div className="flex flex-col gap-2 p-2">
      {navItems.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link to={item.href} key={item.name}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full gap-3 transition-all",
                showLabels ? "justify-start" : "justify-center px-2",
                isActive ? "bg-primary text-primary-foreground" : ""
              )}
            >
              <item.icon size={18} className="shrink-0" />
              {showLabels && <span className="truncate">{item.name}</span>}
            </Button>
          </Link>
        );
      })}
      <Button
        variant="ghost"
        onClick={handleLogout}
        className={cn(
          "w-full gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all mt-auto",
          showLabels ? "justify-start" : "justify-center px-2"
        )}
      >
        <LogOut size={18} className="shrink-0" />
        {showLabels && <span className="truncate">Log Out</span>}
      </Button>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-xl font-bold">Latela</h2>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="py-6">
                  <NavContent showLabels={true} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      ) : (
        <Card 
          className={cn(
            "h-full p-2 transition-all duration-300 ease-in-out relative",
            isExpanded ? "w-64" : "w-16"
          )}
        >
          {/* Toggle Button */}
          <div className={cn(
            "flex items-center mb-6 p-2",
            isExpanded ? "justify-between" : "justify-center"
          )}>
            {isExpanded && <h2 className="text-xl font-bold">Latela</h2>}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="shrink-0"
            >
              {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </Button>
          </div>
          
          <div className="flex flex-col h-[calc(100%-4rem)]">
            <NavContent showLabels={isExpanded} />
          </div>
        </Card>
      )}
    </>
  );
};
