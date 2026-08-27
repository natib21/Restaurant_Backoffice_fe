// src/features/Menu/Components/CategorySelect.tsx

import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Tag, Sparkles, Loader2 } from 'lucide-react';
import {
  useActiveCategoriesQuery,
  type Category,
} from '@/api/Queries/categoryQueries';
import { getCategoryName, getCategoryIcon } from '../lib/categoryUtils';
import CategoryFormModal from './CategoryFormModal';

interface CategorySelectProps {
  value?: string;
  onChange: (categoryId: string, categoryObject?: Category) => void;
  error?: boolean;
  placeholder?: string;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  error,
  placeholder = 'Select a category',
}) => {
  const { data: categories = [], isLoading } = useActiveCategoriesQuery();
  const [modalOpen, setModalOpen] = useState(false);

  // Find currently selected category (match by id, _id, or english name)
  const selectedCategory = categories.find(
    (c) =>
      c.id === value ||
      c._id === value ||
      (typeof c.name === 'string' && c.name === value) ||
      c.name?.en === value
  );

  const handleSelectChange = (val: string) => {
    if (val === '__add_new__') {
      setModalOpen(true);
      return;
    }
    const cat = categories.find((c) => (c.id || c._id) === val);
    onChange(val, cat);
  };

  const handleCategoryCreated = (newCat: Category) => {
    const newId = newCat.id || newCat._id || '';
    onChange(newId, newCat);
  };

  const currentSelectValue = selectedCategory
    ? selectedCategory.id || selectedCategory._id
    : value || '';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Select
          value={currentSelectValue}
          onValueChange={handleSelectChange}
          disabled={isLoading}
        >
          <SelectTrigger
            className={`w-full rounded-xl text-xs h-9 bg-white dark:bg-slate-900 ${
              error ? 'border-destructive' : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Loading categories...</span>
              </div>
            ) : selectedCategory ? (
              <div className="flex items-center gap-2 truncate">
                <span className="text-base leading-none">
                  {getCategoryIcon(selectedCategory)}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {getCategoryName(selectedCategory, 'en')}
                </span>
                {selectedCategory.name?.am && (
                  <span className="text-[11px] text-slate-400 font-normal">
                    ({selectedCategory.name.am})
                  </span>
                )}
              </div>
            ) : value ? (
              <span className="text-slate-900 dark:text-white font-medium">
                {value}
              </span>
            ) : (
              <SelectValue placeholder={placeholder} />
            )}
          </SelectTrigger>

          <SelectContent className="rounded-xl max-h-64">
            <div className="p-1 border-b border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setModalOpen(true)}
                className="w-full justify-start text-xs font-semibold text-primary hover:text-primary hover:bg-primary/5 h-8 rounded-lg"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create New Category
              </Button>
            </div>

            {categories.length === 0 && !isLoading ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No active categories found. Click above to create one.
              </div>
            ) : (
              categories.map((category) => {
                const catId = category.id || category._id || '';
                return (
                  <SelectItem key={catId} value={catId} className="text-xs py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{getCategoryIcon(category)}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {getCategoryName(category, 'en')}
                      </span>
                      {category.name?.am && (
                        <span className="text-[10px] text-slate-400">
                          ({category.name.am})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                );
              })
            )}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setModalOpen(true)}
          title="Create New Category"
          className="h-9 w-9 shrink-0 rounded-xl border-slate-200 dark:border-slate-800 hover:border-primary hover:text-primary"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <CategoryFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleCategoryCreated}
      />
    </div>
  );
};

export default CategorySelect;
