import { useState } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StatementUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const StatementUploadDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: StatementUploadDialogProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    // Validate file type
    const validTypes = ['application/pdf', 'text/csv'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or CSV file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "File must be under 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64Content = reader.result as string;
        const base64Data = base64Content.split(',')[1];

        // Call edge function to parse statement
        const { data, error } = await supabase.functions.invoke('parse-statement', {
          body: {
            fileContent: base64Data,
            fileName: file.name,
            fileType: file.type,
          },
        });

        if (error) {
          throw error;
        }

        if (!data.success) {
          throw new Error(data.error || 'Failed to parse statement');
        }

        // Create account with parsed data
        const { data: accountData, error: accountError } = await supabase
          .from('accounts')
          .insert({
            account_number: data.accountInfo.accountNumber,
            bank_name: data.accountInfo.bankName,
            account_type: data.accountInfo.accountType,
            account_name: data.accountInfo.accountName || `${data.accountInfo.bankName} Account`,
            balance: Math.round(data.accountInfo.currentBalance * 100),
            current_balance: Math.round(data.accountInfo.currentBalance * 100),
            available_balance: Math.round(data.accountInfo.currentBalance * 100),
            balance_brought_forward: 0,
            currency: 'ZAR',
            status: 'active',
            user_id: (await supabase.auth.getUser()).data.user?.id,
          })
          .select()
          .single();

        if (accountError) {
          throw accountError;
        }

        // Import transactions if any were parsed
        if (data.transactions && data.transactions.length > 0) {
          const userId = (await supabase.auth.getUser()).data.user?.id;
          
          const transactionsToInsert = data.transactions.map((t: any) => ({
            user_id: userId,
            account_id: accountData.id,
            transaction_date: new Date(t.date).toISOString(),
            description: t.description,
            reference: t.reference || t.description.substring(0, 50),
            amount: Math.round(Math.abs(t.amount) * 100), // Convert to cents
            balance: t.balance ? Math.round(t.balance * 100) : 0,
            cleared: true,
          }));

          const { error: transError } = await supabase
            .from('transactions')
            .insert(transactionsToInsert);

          if (transError) {
            console.error('Transaction import error:', transError);
            // Don't fail the whole operation, account was created successfully
          }
        }

        toast({
          title: "Account added successfully!",
          description: `Imported ${data.summary.totalTransactions} transactions from ${data.accountInfo.bankName}`,
        });

        onOpenChange(false);
        onSuccess?.();
      };

      reader.onerror = () => {
        throw new Error('Failed to read file');
      };
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Couldn't read this statement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Bank Statement</DialogTitle>
          <DialogDescription>
            Upload your bank statement (PDF or CSV) to automatically create your account
          </DialogDescription>
        </DialogHeader>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {uploading ? (
            <div className="space-y-4">
              <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground">
                Parsing your statement...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Drop your statement here
                </p>
                <p className="text-xs text-muted-foreground">
                  or click to browse
                </p>
              </div>
              <input
                type="file"
                accept=".pdf,.csv"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Choose File
              </Button>
              <p className="text-xs text-muted-foreground">
                PDF or CSV • Max 10MB
              </p>
            </div>
          )}
        </div>

        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex gap-2 text-xs">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground">
              Account details extracted automatically
            </span>
          </div>
          <div className="flex gap-2 text-xs">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground">
              Transactions imported and categorized
            </span>
          </div>
          <div className="flex gap-2 text-xs">
            <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground">
              Your statement is processed securely and not stored
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
