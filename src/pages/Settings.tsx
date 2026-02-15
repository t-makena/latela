import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Edit2, X, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAccounts } from "@/hooks/useAccounts";
import { useTheme } from "next-themes";
import { StatementUploadDialog } from "@/components/accounts/StatementUploadDialog";
import { ManageCustomCategoriesSection } from "@/components/settings/ManageCustomCategoriesSection";
import { useIncomeSettings, IncomeFrequency } from "@/hooks/useIncomeSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserSettings, SavingsAdjustmentStrategy } from "@/hooks/useUserSettings";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { AvatarPickerDialog } from "@/components/settings/AvatarPickerDialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarComponent } from "@/components/avatars/DefaultAvatars";

const Settings = () => {
  const { accounts } = useAccounts();
  const { theme, setTheme } = useTheme();
  const { savingsAdjustmentStrategy, updateSavingsStrategy } = useUserSettings();
  const { profile, getInitials, updateAvatar, updateProfile } = useUserProfile();
  const { user } = useAuth();
  const { 
    payday, 
    frequency, 
    weeklyPayday,
    biweeklyPayday1,
    biweeklyPayday2,
    updatePayday, 
    updateFrequency,
    updateWeeklyPayday,
    updateBiweeklyPayday1,
    updateBiweeklyPayday2,
    weekdayNames,
  } = useIncomeSettings();
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  
  // Profile form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState("");
  
  const [mobile, setMobile] = useState("");
  const [isEditingMobile, setIsEditingMobile] = useState(false);
  const [editedMobile, setEditedMobile] = useState("");

  // Populate from profile once loaded
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setEmail(profile.email || user?.email || "");
      setEditedEmail(profile.email || user?.email || "");
      setMobile(profile.mobile || "");
      setEditedMobile(profile.mobile || "");
    }
  }, [profile, user]);
  
  // Collapsible states
  const [isUsernameOpen, setIsUsernameOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [addAccountDialogOpen, setAddAccountDialogOpen] = useState(false);

  const DefaultAvatarComponent = getAvatarComponent(profile?.default_avatar_id || null);

  const handleAvatarSave = async (
    avatarType: 'default' | 'custom',
    defaultAvatarId?: string,
    avatarUrl?: string
  ) => {
    await updateAvatar(avatarType, defaultAvatarId, avatarUrl);
  };

  const handlePaydayChange = (value: string) => {
    const day = parseInt(value, 10);
    if (!isNaN(day)) {
      updatePayday(day);
      toast.success("Payday updated successfully!");
    }
  };

  const handleFrequencyChange = (value: IncomeFrequency) => {
    updateFrequency(value);
    toast.success("Income frequency updated successfully!");
  };

  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

  const handleChangeUsername = async () => {
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { username: username.trim() }
      });

      if (error) throw error;
      
      toast.success("Username updated successfully!");
      setUsername("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update username");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEmail = async () => {
    try {
      await updateProfile({ email: editedEmail });
      setEmail(editedEmail);
      setIsEditingEmail(false);
      toast.success("Email updated successfully!");
    } catch (error) {
      toast.error("Failed to update email");
    }
  };

  const handleCancelEmail = () => {
    setEditedEmail(email);
    setIsEditingEmail(false);
  };

  const handleSaveMobile = async () => {
    try {
      await updateProfile({ mobile: editedMobile });
      setMobile(editedMobile);
      setIsEditingMobile(false);
      toast.success("Mobile number updated successfully!");
    } catch (error) {
      toast.error("Failed to update mobile number");
    }
  };

  const handleCancelMobile = () => {
    setEditedMobile(mobile);
    setIsEditingMobile(false);
  };

  const handleRemoveAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to remove this account? All associated transactions will also be deleted.")) {
      return;
    }

    setIsLoading(true);
    try {
      // First delete all transactions associated with this account
      const { error: transactionsError } = await supabase
        .from('transactions')
        .delete()
        .eq('account_id', accountId);

      if (transactionsError) throw transactionsError;

      // Then delete the account itself
      const { error: accountError } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId);

      if (accountError) throw accountError;

      toast.success("Account removed successfully!");
      
      // Reload the page to refresh the accounts list
      window.location.reload();
    } catch (error: any) {
      console.error('Error removing account:', error);
      toast.error(error.message || "Failed to remove account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pt-6 px-6">
      <Card className="w-full">
        <CardHeader className="relative pb-2">
          {/* Avatar positioned in top right with edit pencil overlay */}
          <div className="absolute top-4 right-4">
            <div 
              className="relative cursor-pointer group"
              onClick={() => setAvatarPickerOpen(true)}
            >
              {profile?.avatar_type === 'custom' && profile?.avatar_url ? (
                <Avatar className="h-14 w-14 ring-2 ring-foreground">
                  <AvatarImage src={profile.avatar_url} alt="Profile" />
                  <AvatarFallback className="bg-muted text-foreground font-semibold text-lg">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              ) : profile?.avatar_type === 'default' && DefaultAvatarComponent ? (
                <div className="h-14 w-14 rounded-full overflow-hidden ring-2 ring-foreground">
                  <DefaultAvatarComponent className="h-full w-full" />
                </div>
              ) : (
                <Avatar className="h-14 w-14 ring-2 ring-foreground">
                  <AvatarFallback className="bg-muted text-foreground font-semibold text-lg">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              )}
              {/* Edit pencil icon overlay */}
              <div className="absolute bottom-0 right-0 bg-background rounded-full p-1 border border-border shadow-sm group-hover:bg-muted transition-colors">
                <Edit2 className="h-3 w-3" />
              </div>
            </div>
          </div>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={async () => {
                    try {
                      await updateProfile({ first_name: firstName });
                    } catch (error) {
                      toast.error("Failed to update first name");
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={async () => {
                    try {
                      await updateProfile({ last_name: lastName });
                    } catch (error) {
                      toast.error("Failed to update last name");
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              {isEditingEmail ? (
                <div className="flex gap-2">
                  <Input 
                    id="email" 
                    type="email" 
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                  />
                  <Button size="sm" onClick={handleSaveEmail}>Save</Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEmail}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input id="email" type="email" value={email} disabled />
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => setIsEditingEmail(true)}
                    className="shrink-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              {isEditingMobile ? (
                <div className="flex gap-2">
                  <Input 
                    id="mobile" 
                    type="tel" 
                    value={editedMobile}
                    onChange={(e) => setEditedMobile(e.target.value)}
                  />
                  <Button size="sm" onClick={handleSaveMobile}>Save</Button>
                  <Button size="sm" variant="outline" onClick={handleCancelMobile}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input id="mobile" type="tel" value={mobile} disabled />
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => setIsEditingMobile(true)}
                    className="shrink-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Account Management</CardTitle>
          <CardDescription>
            Manage your connected bank accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Display connected accounts */}
            <div className="space-y-2">
              {accounts.map((account) => (
                <div 
                  key={account.id} 
                  className="flex items-center justify-between p-4 rounded-2xl bg-foreground text-background"
                >
                  <div>
                    <p className="font-medium">{account.name}</p>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => handleRemoveAccount(account.id)}
                    disabled={isLoading}
                    className="shrink-0 text-background hover:bg-background/20 hover:text-background"
                    title="Remove account"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center pt-2">
              <Button 
                size="icon" 
                variant="outline"
                onClick={() => setAddAccountDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
          <CardDescription>
            Update your username and password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Change Username - Collapsible */}
            <Collapsible open={isUsernameOpen} onOpenChange={setIsUsernameOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium hover:text-primary transition-colors">
                <span>Change Username</span>
                {isUsernameOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="username"
                      placeholder="Enter new username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                    />
                    <Button 
                      onClick={handleChangeUsername} 
                      disabled={isLoading || !username.trim()}
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="border-b border-border" />

            {/* Change Password - Collapsible */}
            <Collapsible open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium hover:text-primary transition-colors">
                <span>Change Password</span>
                {isPasswordOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={handleChangePassword}
                    disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                    className="w-full"
                  >
                    Change Password
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Income Settings</CardTitle>
          <CardDescription>
            Set your payday to help calculate goal timelines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Income Frequency</Label>
              <Select value={frequency} onValueChange={handleFrequencyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How often you get paid
              </p>
            </div>

            {/* Dynamic payday input based on frequency */}
            {frequency === 'monthly' && (
              <div className="space-y-2">
                <Label htmlFor="payday">Payday (Day of Month)</Label>
                <Input
                  id="payday"
                  type="number"
                  min={1}
                  max={31}
                  value={payday}
                  onChange={(e) => handlePaydayChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The day you typically receive your salary (1-31)
                </p>
              </div>
            )}

            {frequency === 'weekly' && (
              <div className="space-y-2">
                <Label htmlFor="weeklyPayday">Payday (Day of Week)</Label>
                <Select 
                  value={weeklyPayday.toString()} 
                  onValueChange={(val) => {
                    updateWeeklyPayday(parseInt(val, 10));
                    toast.success("Weekly payday updated!");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day of week" />
                  </SelectTrigger>
                  <SelectContent>
                    {weekdayNames.map((name, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The day of the week you get paid
                </p>
              </div>
            )}

            {frequency === 'bi-weekly' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="biweeklyPayday1">First Payday</Label>
                  <Input
                    id="biweeklyPayday1"
                    type="number"
                    min={1}
                    max={31}
                    value={biweeklyPayday1}
                    onChange={(e) => {
                      const day = parseInt(e.target.value, 10);
                      if (!isNaN(day)) {
                        updateBiweeklyPayday1(day);
                        toast.success("First payday updated!");
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    First pay date each month
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="biweeklyPayday2">Second Payday</Label>
                  <Input
                    id="biweeklyPayday2"
                    type="number"
                    min={1}
                    max={31}
                    value={biweeklyPayday2}
                    onChange={(e) => {
                      const day = parseInt(e.target.value, 10);
                      if (!isNaN(day)) {
                        updateBiweeklyPayday2(day);
                        toast.success("Second payday updated!");
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Second pay date each month
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Customize your app settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark theme
                </p>
              </div>
              <Switch 
                checked={theme === "dark"} 
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
            
          </div>
        </CardContent>
      </Card>

      {/* Savings Adjustment Strategy */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('settings.savingsStrategy') || 'Savings Adjustment Strategy'}</CardTitle>
          <CardDescription>
            {t('settings.savingsStrategyDescription') || 'When your available balance falls short of your savings goals, how should we adjust?'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={savingsAdjustmentStrategy}
            onValueChange={async (value) => {
              try {
                await updateSavingsStrategy(value as SavingsAdjustmentStrategy);
                toast.success("Strategy updated successfully!");
              } catch (error) {
                toast.error("Failed to update strategy");
              }
            }}
            className="space-y-4"
          >
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="inverse_priority" id="inverse" className="mt-1" />
              <div>
                <Label htmlFor="inverse" className="font-medium cursor-pointer">
                  {t('settings.inversePriority') || 'Prioritize important goals'}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.inversePriorityDesc') || 'Reduce lower-priority goals more'}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="proportional" id="proportional" className="mt-1" />
              <div>
                <Label htmlFor="proportional" className="font-medium cursor-pointer">
                  {t('settings.proportional') || 'Reduce proportionally'}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.proportionalDesc') || 'Reduce each goal based on its allocation'}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="even_distribution" id="even" className="mt-1" />
              <div>
                <Label htmlFor="even" className="font-medium cursor-pointer">
                  {t('settings.evenDistribution') || 'Reduce equally'}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.evenDistributionDesc') || 'Reduce all goals by the same amount'}
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <LanguageSettings />

      {/* Custom Categories Management */}
      <ManageCustomCategoriesSection />

      <StatementUploadDialog
        open={addAccountDialogOpen}
        onOpenChange={setAddAccountDialogOpen}
        onSuccess={() => window.location.reload()}
      />

      <AvatarPickerDialog
        open={avatarPickerOpen}
        onOpenChange={setAvatarPickerOpen}
        currentAvatarType={profile?.avatar_type || null}
        currentDefaultAvatarId={profile?.default_avatar_id || null}
        onSave={handleAvatarSave}
      />
    </div>
  );
};

export default Settings;
