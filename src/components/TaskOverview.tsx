import React, { useState } from 'react';
import { Task, TaskCategory } from '../types/task';
import { format, addWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subWeeks } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Clock, BarChart2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Modal } from './Modal';
import { TaskList } from './TaskList';
import { TaskAnalysis } from './TaskAnalysis';

type TaskOverviewProps = {
  tasks: Task[];
  categories: TaskCategory[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onCompleteTask: (taskId: string, date: Date, completed: boolean, actualTime?: number) => void;
  getRequiredTimeForReview: (task: Task, date: Date) => number;
};

type WeekDetails = {
  start: Date;
  end: Date;
  totalTime: number;
  categoryTimes: {
    category: TaskCategory;
    time: number;
    tasks: Task[];
  }[];
};

export function TaskOverview({ 
  tasks, 
  categories, 
  onEditTask, 
  onDeleteTask, 
  onCompleteTask,
  getRequiredTimeForReview 
}: TaskOverviewProps) {
  const [startDate, setStartDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<WeekDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'weekly' | 'analysis'>('weekly');

  const tasksByCategory = tasks.reduce((acc, task) => {
    const category = categories.find(c => c.id === task.categoryId);
    if (!category) return acc;
    
    if (!acc[category.id]) {
      acc[category.id] = {
        category,
        tasks: [],
        totalTime: 0,
      };
    }
    
    acc[category.id].tasks.push(task);
    const timeRequired = getRequiredTimeForReview 
      ? getRequiredTimeForReview(task, new Date())
      : task.initialTimeRequired;
    acc[category.id].totalTime += timeRequired;
    
    return acc;
  }, {} as Record<string, { category: TaskCategory; tasks: Task[]; totalTime: number; }>);

  const calculateTimeForWeek = (startDate: Date, endDate: Date): WeekDetails => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const categoryTimes = categories.map(category => ({
      category,
      time: 0,
      tasks: [] as Task[],
    }));

    days.forEach(date => {
      const dayTasks = tasks.filter(task => 
        task.reviewDates.some(d => isSameDay(d, date))
      );

      dayTasks.forEach(task => {
        const categoryTime = categoryTimes.find(ct => ct.category.id === task.categoryId);
        if (categoryTime) {
          const timeRequired = getRequiredTimeForReview(task, date);
          categoryTime.time += timeRequired;
          if (!categoryTime.tasks.some(t => t.id === task.id)) {
            categoryTime.tasks.push(task);
          }
        }
      });
    });

    return {
      start: startDate,
      end: endDate,
      totalTime: categoryTimes.reduce((sum, ct) => sum + ct.time, 0),
      categoryTimes: categoryTimes.filter(ct => ct.time > 0),
    };
  };

  const weeks = Array.from({ length: 4 }, (_, i) => {
    const weekStart = startOfWeek(addWeeks(startDate, i), { locale: ja });
    const weekEnd = endOfWeek(weekStart, { locale: ja });
    return calculateTimeForWeek(weekStart, weekEnd);
  });

  const moveWeeks = (direction: 'prev' | 'next') => {
    setStartDate(current => 
      direction === 'prev' 
        ? subWeeks(current, 4) 
        : addWeeks(current, 4)
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'weekly'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          週別サマリー/カテゴリ別タスク
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'analysis'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          タスク分析
        </button>
      </div>

      {activeTab === 'weekly' ? (
        <>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                週別の復習時間
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => moveWeeks('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="前の4週間"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <input
                    type="date"
                    value={format(startDate, 'yyyy-MM-dd')}
                    onChange={(e) => setStartDate(new Date(e.target.value))}
                    className="bg-transparent border-none p-0 text-sm focus:ring-0"
                  />
                </div>
                <button
                  onClick={() => moveWeeks('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="次の4週間"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weeks.map((week, index) => (
                <button
                  key={week.start.toISOString()}
                  onClick={() => setSelectedWeek(week)}
                  className="p-4 rounded-lg bg-white border border-gray-200 relative overflow-hidden hover:border-indigo-200 transition-colors text-left"
                >
                  <div className="relative z-10">
                    <div className="text-sm text-gray-600">
                      {index === 0 ? '初週' : `${index + 1}週目`}
                    </div>
                    <div className="mt-1 text-2xl font-bold text-gray-900">
                      {week.totalTime}分
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(week.start, 'M/d (E)', { locale: ja })} - {format(week.end, 'M/d (E)', { locale: ja })}
                    </div>
                  </div>
                  <div
                    className="absolute bottom-0 left-0 h-1 bg-indigo-100"
                    style={{ width: '100%' }}
                  >
                    <div
                      className="h-full bg-indigo-600 transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (week.totalTime / (8 * 60)) * 100)}%`,
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              カテゴリ別タスク
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(tasksByCategory).map(({ category, tasks, totalTime }) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category)}
                  className="p-4 rounded-lg bg-white border border-gray-200 hover:border-indigo-200 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      合計: {totalTime}分
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    タスク数: {tasks.length}件
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (tasks.length / 10) * 100)}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <TaskAnalysis
          tasks={tasks}
          categories={categories}
          getRequiredTimeForReview={getRequiredTimeForReview}
        />
      )}

      <Modal
        isOpen={selectedCategory !== null}
        onClose={() => setSelectedCategory(null)}
        title={`${selectedCategory?.name}のタスク一覧`}
      >
        {selectedCategory && (
          <TaskList
            tasks={tasks.filter(task => task.categoryId === selectedCategory.id)}
            categories={categories}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onCompleteTask={onCompleteTask}
            getRequiredTimeForReview={getRequiredTimeForReview}
          />
        )}
      </Modal>

      <Modal
        isOpen={selectedWeek !== null}
        onClose={() => setSelectedWeek(null)}
        title={selectedWeek ? `${format(selectedWeek.start, 'M/d')} - ${format(selectedWeek.end, 'M/d')}の復習詳細` : ''}
      >
        {selectedWeek && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedWeek.categoryTimes.map(({ category, time, tasks }) => (
                <div
                  key={category.id}
                  className="p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {time}分
                  </div>
                  <div className="text-sm text-gray-600">
                    タスク数: {tasks.length}件
                  </div>
                  <div className="mt-2">
                    <TaskList
                      tasks={tasks}
                      categories={categories}
                      onEditTask={onEditTask}
                      onDeleteTask={onDeleteTask}
                      onCompleteTask={onCompleteTask}
                      selectedDate={selectedWeek.start}
                      getRequiredTimeForReview={getRequiredTimeForReview}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}