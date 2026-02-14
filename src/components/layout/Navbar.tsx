import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Wallet, Calendar, Settings, Menu, Target, LogOut, PanelLeftClose, Calculator, ChevronDown, Sparkles, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { LatelaIcon } from "@/components/ui/latela-icon";
import { useAccounts } from "@/hooks/useAccounts";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarComponent } from "@/components/avatars/DefaultAvatars";
import { useFloatingChat } from "@/contexts/FloatingChatContext";
import { useLongPress } from "@/hooks/useLongPress";
export const Navbar = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(true);
  const { accounts } = useAccounts();
  const { t } = useLanguage();
  const { profile, getInitials, getDisplayName } = useUserProfile();
  const { open: openFloatingChat } = useFloatingChat();
  const longPressHandlers = useLongPress(openFloatingChat, 500);

  const UserAvatar = ({ showLabels = true }: { showLabels?: boolean }) => {
    const DefaultAvatarComponent = getAvatarComponent(profile?.default_avatar_id || null);
    
    return (
      <Link to="/settings" className="block">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-accent",
          showLabels ? "" : "justify-center"
        )}>
          {profile?.avatar_type === 'custom' && profile?.avatar_url ? (
            <Avatar className={cn(
              "ring-2 ring-foreground",
              showLabels ? "h-10 w-10" : "h-20 w-20"
            )}>
              <AvatarImage src={profile.avatar_url} alt="Profile" />
              <AvatarFallback className="bg-muted text-foreground font-semibold text-sm">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          ) : profile?.avatar_type === 'default' && DefaultAvatarComponent ? (
            <div className={cn(
              "rounded-full overflow-hidden ring-2 ring-foreground",
              showLabels ? "h-10 w-10" : "h-20 w-20"
            )}>
              <DefaultAvatarComponent className="h-full w-full" />
            </div>
          ) : (
            <Avatar className={cn(
              "ring-2 ring-foreground",
              showLabels ? "h-10 w-10" : "h-20 w-20"
            )}>
              <AvatarFallback className="bg-muted text-foreground font-semibold text-sm">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          )}
          {showLabels && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{getDisplayName() || 'Profile'}</p>
              {profile?.username && (
                <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
              )}
            </div>
          )}
        </div>
      </Link>
    );
  };

  const navItems = [
    { name: t('nav.dashboard'), href: "/", icon: Home },
    { name: t('nav.budget'), href: "/budget", icon: Calculator },
    { name: "Budget Buddy", href: "/chat", icon: Sparkles },
    { name: t('nav.goals'), href: "/goals", icon: Target },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: t('nav.calendar'), href: "/calendar", icon: Calendar },
    { name: t('nav.settings'), href: "/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out");
    } else {
      toast.success("Logged out successfully");
      navigate("/auth");
    }
  };
  
  const NavContent = ({ showLabels = true }: { showLabels?: boolean }) => {
    const isAccountsPath = location.pathname.startsWith('/accounts');
    
    return (
      <div className={cn("flex flex-col gap-2", showLabels ? "px-2" : "")}>
        {navItems.slice(0, 1).map((item) => {
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
                  <span className="truncate font-brand">{item.name}</span>
                </Button>
              ) : (
                <div className={cn(
                  "w-full flex items-center justify-center py-3 transition-colors cursor-pointer rounded-lg",
                  isActive ? "bg-foreground text-background" : "text-foreground hover:bg-accent"
                )}>
                  <item.icon size={20} className="shrink-0" />
                </div>
              )}
            </Link>
          );
        })}

        {/* Accounts Section with Subsections */}
        {showLabels ? (
          <Collapsible open={accountsOpen} onOpenChange={setAccountsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant={isAccountsPath && location.pathname === '/accounts' ? "default" : "ghost"}
                size="lg"
                className={cn(
                  "w-full gap-3 transition-all justify-start text-base h-12",
                  isAccountsPath && location.pathname === '/accounts' ? "bg-primary text-primary-foreground" : ""
                )}
              >
                <Wallet size={22} className="shrink-0" />
                <span className="truncate flex-1 text-left font-brand">{t('nav.accounts')}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", accountsOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-1 mt-1">
              {accounts.length > 1 && (
                <Link to="/accounts">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start text-sm h-10",
                      location.pathname === '/accounts' && "bg-accent"
                    )}
                  >
                    {t('nav.allAccounts')}
                  </Button>
                </Link>
              )}
              {accounts.map((account) => (
                <Link key={account.id} to={`/accounts/${account.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start text-sm h-10",
                      location.pathname === `/accounts/${account.id}` && "bg-accent"
                    )}
                  >
                    {account.name}
                  </Button>
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <Link to="/accounts">
            <div className={cn(
              "w-full flex items-center justify-center py-3 transition-colors cursor-pointer rounded-lg",
              isAccountsPath ? "bg-foreground text-background" : "text-foreground hover:bg-accent"
            )}>
              <Wallet size={20} className="shrink-0" />
            </div>
          </Link>
        )}

        {/* Remaining Nav Items */}
        {navItems.slice(1).map((item) => {
          const isActive = location.pathname === item.href;
          const isBudgetBuddy = item.href === "/chat";
          const linkProps = isBudgetBuddy ? longPressHandlers : {};
          return (
            <Link to={item.href} key={item.name} {...linkProps}>
              {showLabels ? (
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="lg"
                  className={cn(
                    "w-full gap-3 transition-all justify-start text-base h-12",
                    isActive ? "bg-primary text-primary-foreground" : ""
                  )}
                >
                  <item.icon size={22} className="shrink-0" {...(item.icon === Sparkles ? { fill: "currentColor", strokeWidth: 1.5 } : {})} />
                  <span className="truncate font-brand">{item.name}</span>
                </Button>
              ) : (
                <div className={cn(
                  "w-full flex items-center justify-center py-3 transition-colors cursor-pointer rounded-lg",
                  isActive ? "bg-foreground text-background" : "text-foreground hover:bg-accent"
                )}>
                  <item.icon size={20} className="shrink-0" {...(item.icon === Sparkles ? { fill: "currentColor", strokeWidth: 1.5 } : {})} />
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
            <span className="truncate font-brand">{t('nav.logout')}</span>
          </Button>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center py-3 text-destructive hover:text-destructive/80 transition-colors cursor-pointer rounded-lg"
          >
            <LogOut size={20} className="shrink-0" />
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      {isMobile ? (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between p-4">
            <LatelaIcon className="h-10 w-10" />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col items-center mb-6 pt-4">
                <h2 className="text-2xl font-bold font-brand">Latela</h2>
                </div>
                <div className="py-2">
                  <NavContent showLabels={true} />
                </div>
                <div className="border-t pt-4 mt-2">
                  <UserAvatar showLabels={true} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      ) : (
        <div 
          className={cn(
            "h-fit transition-all duration-300 ease-in-out relative bg-background rounded-2xl border-2 border-foreground sidebar-nav",
            isExpanded ? "w-64 pt-6 px-2 pb-4" : "w-24 pt-6 pb-4 px-2"
          )}
        >
          {/* Toggle Button / Logo */}
          <div className={cn(
            "flex items-center mb-6",
            isExpanded ? "justify-between px-2" : "justify-center"
          )}>
            {isExpanded ? (
              <>
                <h2 className="text-2xl font-bold font-brand">Latela</h2>
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
                <LatelaIcon className="h-20 w-20" />
              </button>
            )}
          </div>
          
          <div className="flex flex-col gap-3">
            <NavContent showLabels={isExpanded} />
            <div className={cn("pt-2", isExpanded ? "px-2" : "flex justify-center")}>
              <UserAvatar showLabels={isExpanded} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
