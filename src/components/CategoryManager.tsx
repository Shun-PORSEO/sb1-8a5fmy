import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { TaskCategory } from '../types/task';

type CategoryManagerProps = {
  categories: TaskCategory[];
  onAddCategory: (category: Omit<TaskCategory, 'id'>) => void;
  onUpdateCategory: (id: string, category: Omit<TaskCategory, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
};

export function CategoryManager({ categories, onAddCategory, onUpdateCategory, onDeleteCategory }: CategoryManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState(false);

  const CategoryForm = ({ category, onSubmit, onCancel }: {
    category?: TaskCategory;
    onSubmit: (data: Omit<TaskCategory, 'id'>) => void;
    onCancel: () => void;
  }) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSubmit({
          name: formData.get('name') as string,
          color: formData.get('color') as string,
        });
      }}
      className="p-4 bg-gray-50 rounded-lg"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            カテゴリ名
          </label>
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={category?.name}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="color" className="block text-sm font-medium text-gray-700">
            カラー
          </label>
          <input
            type="color"
            id="color"
            name="color"
            defaultValue={category?.color}
            required
            className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            {category ? '更新' : '追加'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            キャンセル
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">カテゴリ管理</h3>
        <button
          onClick={() => setNewCategory(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          新規カテゴリ
        </button>
      </div>

      {newCategory && (
        <CategoryForm
          onSubmit={(data) => {
            onAddCategory(data);
            setNewCategory(false);
          }}
          onCancel={() => setNewCategory(false)}
        />
      )}

      <div className="space-y-2">
        {categories.map(category => (
          <div key={category.id}>
            {editingId === category.id ? (
              <CategoryForm
                category={category}
                onSubmit={(data) => {
                  onUpdateCategory(category.id, data);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingId(category.id)}
                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('このカテゴリを削除してもよろしいですか？')) {
                        onDeleteCategory(category.id);
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}