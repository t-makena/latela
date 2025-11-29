import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useCustomCategories } from '@/hooks/useCustomCategories';

interface AddCustomCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParentCategory {
  id: string;
  name: string;
}

interface SystemSubcategory {
  id: string;
  name: string;
  color: string;
}

export const AddCustomCategoryDialog = ({
  open,
  onOpenChange
}: AddCustomCategoryDialogProps) => {
  const { createCustomCategory } = useCustomCategories();
  
  const [type, setType] = useState<'new' | 'replace'>('new');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [systemSubcategoryId, setSystemSubcategoryId] = useState('');
  const [customName, setCustomName] = useState('');
  const [color, setColor] = useState('#6B7280');
  const [loading, setLoading] = useState(false);

  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);
  const [systemSubcategories, setSystemSubcategories] = useState<SystemSubcategory[]>([]);

  useEffect(() => {
    if (open) {
      fetchParentCategories();
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    if (parentCategoryId && type === 'replace') {
      fetchSystemSubcategories();
    }
  }, [parentCategoryId, type]);

  useEffect(() => {
    // Set default color from selected system subcategory
    if (systemSubcategoryId && type === 'replace') {
      const sub = systemSubcategories.find(s => s.id === systemSubcategoryId);
      if (sub) {
        setColor(sub.color || '#6B7280');
      }
    }
  }, [systemSubcategoryId, type, systemSubcategories]);

  const resetForm = () => {
    setType('new');
    setParentCategoryId('');
    setSystemSubcategoryId('');
    setCustomName('');
    setColor('#6B7280');
  };

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

  const fetchSystemSubcategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get system subcategories
      const { data: systemSubs, error: systemError } = await supabase
        .from('categories')
        .select('id, name, color')
        .eq('parent_id', parentCategoryId)
        .order('name');

      if (systemError) throw systemError;

      // Get already replaced categories for this user
      const { data: replaced, error: replacedError } = await supabase
        .from('user_custom_categories')
        .select('replaces_category_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .not('replaces_category_id', 'is', null);

      if (replacedError) throw replacedError;

      const replacedIds = new Set(replaced?.map(r => r.replaces_category_id));

      // Filter out already replaced categories
      const available = systemSubs?.filter(sub => !replacedIds.has(sub.id)) || [];
      
      setSystemSubcategories(available);
    } catch (error) {
      console.error('Error fetching system subcategories:', error);
    }
  };

  const handleSave = async () => {
    if (!customName.trim()) {
      return;
    }

    if (!parentCategoryId) {
      return;
    }

    if (type === 'replace' && !systemSubcategoryId) {
      return;
    }

    setLoading(true);
    try {
      await createCustomCategory(
        customName.trim(),
        parentCategoryId,
        color,
        type === 'replace' ? systemSubcategoryId : undefined
      );
      
      onOpenChange(false);
    } catch (error) {
      // Error is already handled in the hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Subcategory</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as 'new' | 'replace')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="type-new" />
                <Label htmlFor="type-new" className="font-normal cursor-pointer">
                  Create new subcategory
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="replace" id="type-replace" />
                <Label htmlFor="type-replace" className="font-normal cursor-pointer">
                  Replace existing subcategory
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent-category">Parent Category</Label>
            <Select value={parentCategoryId} onValueChange={setParentCategoryId}>
              <SelectTrigger id="parent-category">
                <SelectValue placeholder="Select parent category" />
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

          {type === 'replace' && parentCategoryId && (
            <div className="space-y-2">
              <Label htmlFor="system-subcategory">System Subcategory to Replace</Label>
              <Select 
                value={systemSubcategoryId} 
                onValueChange={setSystemSubcategoryId}
              >
                <SelectTrigger id="system-subcategory">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {systemSubcategories.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No available subcategories to replace
                    </div>
                  ) : (
                    systemSubcategories.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: sub.color }}
                          />
                          <span>{sub.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="custom-name">
              {type === 'replace' ? 'Custom Name' : 'Subcategory Name'}
            </Label>
            <Input
              id="custom-name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20 cursor-pointer rounded border"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#6B7280"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || !customName.trim() || !parentCategoryId || (type === 'replace' && !systemSubcategoryId)}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
