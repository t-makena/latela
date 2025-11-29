import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { AddCustomCategoryDialog } from './AddCustomCategoryDialog';
import { Skeleton } from '@/components/ui/skeleton';

export const ManageCustomCategoriesSection = () => {
  const { customCategories, loading, deleteCustomCategory } = useCustomCategories();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleDelete = async (id: string, replacesCategoryId?: string) => {
    await deleteCustomCategory(id, replacesCategoryId);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Categories</CardTitle>
              <CardDescription>
                Create custom subcategories or replace system categories with your own names
              </CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-60" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : customCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No custom categories yet.</p>
              <p className="text-sm mt-1">
                Create custom subcategories or replace system categories with your own names.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {customCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{category.name}</span>
                        {category.replaces_category_id && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <RefreshCw className="h-3 w-3" />
                            Replaces: {category.replaces_category_name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Parent: {category.parent_category_name}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.id, category.replaces_category_id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddCustomCategoryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </>
  );
};
