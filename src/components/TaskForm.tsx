import React, { useState } from 'react';
import { Task, TaskCategory } from '../types/task';
import { format } from 'date-fns';

const TIME_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const minutes = (i + 1) * 30;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return {
    value: minutes,
    label: hours > 0
      ? remainingMinutes > 0
        ? `${hours}時間${remainingMinutes}分`
        : `${hours}時間`
      : `${minutes}分`
  };
});

type TaskFormProps = {
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'reviewDates' | 'completedReviews'> & { startDate: Date }) => void;
  onCancel: () => void;
  initialData?: Partial<Task>;
  categories: TaskCategory[];
};

export function TaskForm({ onSubmit, onCancel, initialData, categories }: TaskFormProps) {
  const [selectedTime, setSelectedTime] = useState<number>(
    initialData?.initialTimeRequired || TIME_OPTIONS[2].value
  );
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSubmit({
          title: formData.get('title') as string,
          description: formData.get('description') as string,
          initialTimeRequired: selectedTime,
          categoryId: formData.get('category') as string,
          startDate: new Date(formData.get('startDate') as string),
        });
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          タスク名
        </label>
        <input
          type="text"
          id="title"
          name="title"
          defaultValue={initialData?.title}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
          実施日
        </label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          defaultValue={today}
          required
          max={today}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          カテゴリ
        </label>
        <select
          id="category"
          name="category"
          defaultValue={initialData?.categoryId || categories[0].id}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          説明
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={initialData?.description}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="time" className="block text-sm font-medium text-gray-700">
          インプットにかかった時間
        </label>
        <select
          id="time"
          value={selectedTime}
          onChange={(e) => setSelectedTime(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          {TIME_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {initialData ? '更新' : '追加'}
        </button>
      </div>
    </form>
  );
}