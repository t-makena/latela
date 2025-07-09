
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Wallet, Calendar, Settings, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";

const navItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Accounts", href: "/accounts", icon: Wallet },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const Navbar = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  
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
        <Card className="fixed bottom-4 left-4 right-4 z-50 p-2 rounded-full shadow-lg bg-card mx-auto max-w-md">
          <div className="flex items-center justify-center gap-6">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link to={item.href} key={item.name}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "rounded-full",
                      isActive ? "bg-primary text-primary-foreground" : ""
                    )}
                  >
                    <item.icon size={20} />
                  </Button>
                </Link>
              );
            })}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom">
                <div className="py-6">
                  <NavContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </Card>
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
