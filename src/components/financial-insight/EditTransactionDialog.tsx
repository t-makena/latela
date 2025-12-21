import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useSubcategories } from '@/hooks/useSubcategories';
import { 
  normalizeMerchantName, 
  extractMerchantCore, 
  extractDisplayMerchantName,
  isFuzzyMerchantMatch 
} from '@/lib/merchantUtils';

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: {
    id: string;
    description: string;
    category_id: string | null;
  };
  onSave: () => void;
}

interface ParentCategory {
  id: string;
  name: string;
}

export const EditTransactionDialog = ({
  open,
  onOpenChange,
  transaction,
  onSave
}: EditTransactionDialogProps) => {
  const [merchantName, setMerchantName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const { subcategories, loading: subcategoriesLoading } = useSubcategories(selectedParentCategory);

  useEffect(() => {
    if (open) {
      setMerchantName(transaction.description || '');
      // Suggest a display name based on the description
      setDisplayName(extractDisplayMerchantName(transaction.description || ''));
      fetchParentCategories();
    }
  }, [open, transaction]);

  const fetchParentCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .is('parent_id', null)
        .order('name');

      if (error) throw error;
      setParentCategories(data || []);
    } catch (error) {
      console.error('Error fetching parent categories:', error);
    }
  };

  const handleSave = async () => {
    if (!merchantName.trim()) {
      toast.error('Please enter a merchant name');
      return;
    }

    if (!selectedParentCategory) {
      toast.error('Please select a category');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const normalizedMerchantName = normalizeMerchantName(merchantName);
      const merchantPattern = extractMerchantCore(merchantName);
      const finalDisplayName = displayName.trim() || extractDisplayMerchantName(merchantName);

      // Check if mapping already exists
      const { data: existing } = await supabase
        .from('user_merchant_mappings')
        .select('id')
        .eq('user_id', user.id)
        .ilike('merchant_name', normalizedMerchantName)
        .eq('is_active', true)
        .maybeSingle();

      const subcategory = subcategories.find(s => 
        s.id === selectedSubcategory || s.custom_category_id === selectedSubcategory
      );

      const subcategoryId = selectedSubcategory === 'none' ? null : (
        subcategory?.is_custom ? null : (selectedSubcategory || null)
      );
      const customSubcategoryId = selectedSubcategory === 'none' ? null : (
        subcategory?.is_custom ? (subcategory.custom_category_id || selectedSubcategory) : null
      );

      const mappingData = {
        user_id: user.id,
        merchant_name: normalizedMerchantName,
        merchant_pattern: merchantPattern,
        display_name: finalDisplayName,
        category_id: selectedParentCategory,
        subcategory_id: subcategoryId,
        custom_subcategory_id: customSubcategoryId,
        is_active: true
      };

      if (existing) {
        // Update existing mapping
        const { error } = await supabase
          .from('user_merchant_mappings')
          .update(mappingData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new mapping
        const { error } = await supabase
          .from('user_merchant_mappings')
          .insert(mappingData);

        if (error) throw error;
      }

      // Retroactively update ALL existing transactions with fuzzy matching merchant names
      const updatedCount = await updateMatchingTransactions(
        user.id,
        normalizedMerchantName,
        merchantPattern,
        selectedParentCategory,
        subcategoryId || customSubcategoryId,
        finalDisplayName
      );

      toast.success(
        updatedCount > 1 
          ? `Updated ${updatedCount} transactions with similar merchants` 
          : 'Merchant mapping saved successfully'
      );
      onSave();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Error saving merchant mapping:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save merchant mapping';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates all existing transactions that fuzzy-match the merchant name
   * with the new category settings and display name.
   */
  const updateMatchingTransactions = async (
    userId: string,
    normalizedMerchantName: string,
    merchantPattern: string,
    categoryId: string,
    subcategoryId: string | null,
    displayMerchantName: string
  ): Promise<number> => {
    try {
      // Fetch all user's transactions
      const { data: allTransactions, error: fetchError } = await supabase
        .from('transactions')
        .select('id, description')
        .eq('user_id', userId);

      if (fetchError) throw fetchError;
      if (!allTransactions || allTransactions.length === 0) return 0;

      // Find transactions with fuzzy-matching merchant names
      const matchingTransactionIds: string[] = [];
      for (const tx of allTransactions) {
        const txDescription = tx.description || '';
        
        // Use fuzzy matching to find similar merchants
        if (isFuzzyMerchantMatch(txDescription, normalizedMerchantName, 0.7)) {
          matchingTransactionIds.push(tx.id);
        }
      }

      if (matchingTransactionIds.length === 0) return 0;

      // Update all matching transactions with category and display name
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          category_id: categoryId,
          subcategory_id: subcategoryId,
          display_merchant_name: displayMerchantName,
          user_verified: true,
          auto_categorized: false,
          categorization_confidence: 1.0,
          is_categorized: true
        })
        .in('id', matchingTransactionIds);

      if (updateError) throw updateError;

      return matchingTransactionIds.length;
    } catch (error) {
      console.error('Error updating matching transactions:', error);
      return 0;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="merchant-name">Merchant Name</Label>
            <Input
              id="merchant-name"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="Enter merchant name"
            />
            <p className="text-xs text-muted-foreground">
              Similar merchants will be matched automatically
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display-name">Display As</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should this merchant be displayed?"
            />
            <p className="text-xs text-muted-foreground">
              This name will be shown for all matching transactions
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent-category">Category</Label>
            <Select value={selectedParentCategory} onValueChange={setSelectedParentCategory}>
              <SelectTrigger id="parent-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {parentCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedParentCategory && (
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory (Optional)</Label>
              <Select 
                value={selectedSubcategory} 
                onValueChange={setSelectedSubcategory}
                disabled={subcategoriesLoading}
              >
                <SelectTrigger id="subcategory">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {subcategories
                    .filter(s => !s.replaces_category_id || s.is_custom)
                    .map((sub) => (
                      <SelectItem 
                        key={sub.custom_category_id || sub.id} 
                        value={sub.custom_category_id || sub.id}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: sub.color }}
                          />
                          <span>{sub.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
