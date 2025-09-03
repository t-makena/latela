
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Wallet, Calendar, Settings, Menu, TrendingUp, Target } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";

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
  const { signOut, user } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "An error occurred while signing out. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const NavContent = () => (
    <div className="flex flex-col gap-2 p-2">
      {navItems.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link to={item.href} key={item.name}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className={cn("w-full justify-start gap-3", 
                isActive ? "bg-primary text-primary-foreground" : ""
              )}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
            </Button>
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {isMobile ? (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-xl font-bold">Zaka</h2>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="py-6">
                  <NavContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      ) : (
        <Card className="h-full p-2">
          <div className="mb-6 p-2">
            <h2 className="text-xl font-bold text-center">Zaka</h2>
          </div>
          <NavContent />
        </Card>
      )}
    </>
  );
};
