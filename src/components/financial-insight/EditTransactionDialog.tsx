import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useSubcategories } from '@/hooks/useSubcategories';

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
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const { subcategories, loading: subcategoriesLoading } = useSubcategories(selectedParentCategory);

  useEffect(() => {
    if (open) {
      setMerchantName(transaction.description || '');
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

      // Check if mapping already exists
      const { data: existing } = await supabase
        .from('user_merchant_mappings')
        .select('id')
        .eq('user_id', user.id)
        .eq('merchant_name', merchantName.trim())
        .eq('is_active', true)
        .maybeSingle();

      const subcategory = subcategories.find(s => 
        s.id === selectedSubcategory || s.custom_category_id === selectedSubcategory
      );

      const mappingData = {
        user_id: user.id,
        merchant_name: merchantName.trim(),
        category_id: selectedParentCategory,
        subcategory_id: subcategory?.is_custom ? null : (selectedSubcategory || null),
        custom_subcategory_id: subcategory?.is_custom ? (subcategory.custom_category_id || selectedSubcategory) : null,
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

      toast.success('Merchant mapping saved successfully');
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving merchant mapping:', error);
      toast.error(error.message || 'Failed to save merchant mapping');
    } finally {
      setLoading(false);
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
