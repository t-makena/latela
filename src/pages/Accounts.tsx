
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountDetail } from "@/components/accounts/AccountDetail";
import { accounts } from "@/lib/data";

const Accounts = () => {
  const [selectedAccount, setSelectedAccount] = useState(accounts[0].id);

  const handleTabChange = (accountId: string) => {
    setSelectedAccount(accountId);
  };

  const currentAccount = accounts.find(acc => acc.id === selectedAccount) || accounts[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Accounts</h1>
        <p className="text-muted-foreground">
          Manage your bank accounts and track transactions
        </p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <Tabs 
            defaultValue={accounts[0].id} 
            value={selectedAccount}
            onValueChange={handleTabChange}
          >
            <div className="flex justify-center mb-4">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                {accounts.map(account => (
                  <TabsTrigger key={account.id} value={account.id} className="flex gap-2 items-center">
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
