
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountDetail } from "@/components/accounts/AccountDetail";
import { useAccounts } from "@/hooks/useAccounts";

const Accounts = () => {
  const { accounts, loading, error } = useAccounts();
  const [selectedAccount, setSelectedAccount] = useState<string>("");

  // Set initial selected account when accounts load
  React.useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0].id);
    }
  }, [accounts, selectedAccount]);

  const handleTabChange = (accountId: string) => {
    setSelectedAccount(accountId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse">
              <div className="flex justify-center mb-4">
                <div className="h-10 w-64 bg-gray-200 rounded"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Error loading accounts: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No accounts found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentAccount = accounts.find(acc => acc.id === selectedAccount) || accounts[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <Tabs 
            defaultValue={accounts[0]?.id} 
            value={selectedAccount}
            onValueChange={handleTabChange}
          >
            <div className="flex justify-center mb-4">
              <TabsList className="inline-flex w-auto min-w-fit">
                {accounts.map(account => (
                  <TabsTrigger key={account.id} value={account.id} className="flex gap-2 items-center justify-center whitespace-nowrap">
                    <div 
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: account.color }}
                    />
                    {account.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            {accounts.map(account => (
              <TabsContent key={account.id} value={account.id}>
                <AccountDetail account={account} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Accounts;
