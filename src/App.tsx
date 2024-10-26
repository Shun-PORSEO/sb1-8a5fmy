import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, BookOpen, Plus, ChevronLeft, ChevronRight, Settings, Info } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isWeekend, getDay, isAfter } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Task, TaskCategory, DEFAULT_CATEGORIES } from './types/task';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { Modal } from './components/Modal';
import { CategoryManager } from './components/CategoryManager';
import { TaskOverview } from './components/TaskOverview';
import { TimeSettings } from './components/TimeSettings';

// Constants moved to the top
const REVIEW_INTERVALS = [
  1/(24*3),  // 20分後
  1,         // 1日後
  3,         // 3日後
  7,         // 1週間後
  14,        // 2週間後
  30,        // 1ヶ月後
  60,        // 2ヶ月後
  90,        // 3ヶ月後
  180        // 6ヶ月後
];

const TIME_MULTIPLIERS = [
  0.25,  // 20分後
  0.17,  // 1日後
  0.13,  // 3日後
  0.10,  // 1週間後
  0.08,  // 2週間後
  0.05,  // 1ヶ月後
  0.03,  // 2ヶ月後
  0.02,  // 3ヶ月後
  0.02   // 6ヶ月後
];

// Type definitions
type DailyTimeSettings = {
  date: string;
  timeLimit: number;
};

type TaskWithTime = {
  task: Task;
  requiredTime: number;
};

// Local Storage Keys
const STORAGE_KEYS = {
  TASKS: 'learning-management-tasks',
  CATEGORIES: 'learning-management-categories',
  TIME_LIMITS: 'learning-management-time-limits',
  CUSTOM_TIME_SETTINGS: 'learning-management-custom-time-settings'
};

function App() {
  // State management
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    return savedTasks ? JSON.parse(savedTasks).map((task: any) => ({
      ...task,
      createdAt: new Date(task.createdAt),
      reviewDates: task.reviewDates.map((date: string) => new Date(date)),
      completedReviews: task.completedReviews.map((review: any) => ({
        ...review,
        date: new Date(review.date)
      }))
    })) : [];
  });

  const [categories, setCategories] = useState<TaskCategory[]>(() => {
    const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return savedCategories ? JSON.parse(savedCategories) : DEFAULT_CATEGORIES;
  });

  const [dailyTimeLimit, setDailyTimeLimit] = useState(() => {
    const savedLimits = localStorage.getItem(STORAGE_KEYS.TIME_LIMITS);
    return savedLimits ? JSON.parse(savedLimits) : {
      weekday: 120,
      weekend: 240
    };
  });

  const [dailyTimeSettings, setDailyTimeSettings] = useState<DailyTimeSettings[]>(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEYS.CUSTOM_TIME_SETTINGS);
    return savedSettings ? JSON.parse(savedSettings) : [];
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'overview'>('calendar');

  // Persist state changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TIME_LIMITS, JSON.stringify(dailyTimeLimit));
  }, [dailyTimeLimit]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TIME_SETTINGS, JSON.stringify(dailyTimeSettings));
  }, [dailyTimeSettings]);

  // Calendar related calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Time management functions
  const getDailyLimit = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const customSetting = dailyTimeSettings.find(setting => setting.date === dateStr);
    if (customSetting) {
      return customSetting.timeLimit;
    }
    return isWeekend(date) ? dailyTimeLimit.weekend : dailyTimeLimit.weekday;
  };

  const getRequiredTimeForReview = (task: Task, date: Date) => {
    const completedReviewsCount = task.completedReviews.filter(review => 
      isAfter(date, review.date)
    ).length;

    const nextReviewIndex = Math.min(completedReviewsCount, TIME_MULTIPLIERS.length - 1);
    return Math.round(task.initialTimeRequired * TIME_MULTIPLIERS[nextReviewIndex]);
  };

  // Task management functions
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'reviewDates' | 'completedReviews'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      reviewDates: REVIEW_INTERVALS.map(interval => {
        const date = new Date();
        date.setDate(date.getDate() + interval);
        return date;
      }),
      completedReviews: [],
    };
    setTasks(prev => [...prev, newTask]);
    setIsAddingTask(false);
  };

  const updateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'reviewDates' | 'completedReviews'>) => {
    if (!editingTask) return;
    
    setTasks(prev => prev.map(task => {
      if (task.id === editingTask.id) {
        return {
          ...task,
          ...taskData,
        };
      }
      return task;
    }));
    setEditingTask(null);
  };

  const deleteTask = (taskId: string) => {
    if (confirm('このタスクを削除してもよろしいですか？')) {
      setTasks(prev => prev.filter(task => task.id !== taskId));
    }
  };

  const completeTask = (taskId: string, date: Date, completed: boolean, actualTime?: number) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        if (completed) {
          return {
            ...task,
            completedReviews: [...task.completedReviews, {
              date,
              timeSpent: getRequiredTimeForReview(task, date),
              actualTime: actualTime || getRequiredTimeForReview(task, date),
              retention: 100
            }]
          };
        } else {
          return {
            ...task,
            completedReviews: task.completedReviews.filter(review => !isSameDay(review.date, date))
          };
        }
      }
      return task;
    }));
  };

  // Category management functions
  const addCategory = (category: Omit<TaskCategory, 'id'>) => {
    const newCategory: TaskCategory = {
      ...category,
      id: crypto.randomUUID(),
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (id: string, category: Omit<TaskCategory, 'id'>) => {
    setCategories(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, ...category };
      }
      return c;
    }));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Task retrieval functions
  const getTasksForDate = (date: Date): TaskWithTime[] => {
    return tasks
      .filter(task => task.reviewDates.some(reviewDate => isSameDay(reviewDate, date)))
      .map(task => ({
        task,
        requiredTime: getRequiredTimeForReview(task, date)
      }));
  };

  const getTotalTimeForDate = (date: Date) => {
    return getTasksForDate(date).reduce((total, { requiredTime }) => 
      total + requiredTime, 0
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-indigo-600" />
              復習管理システム -リマイン-
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowTimeSettings(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 rounded-lg hover:bg-white/50 transition-colors"
              >
                <Clock className="w-5 h-5" />
                時間設定
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 rounded-lg hover:bg-white/50 transition-colors"
              >
                <Settings className="w-5 h-5" />
                カテゴリ設定
              </button>
              <button
                onClick={() => setIsAddingTask(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                新規タスク
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              カレンダー
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              タスク管理
            </button>
          </div>
        </header>

        <main>
          {activeTab === 'calendar' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-indigo-600" />
                    カレンダー
                  </h2>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={prevMonth}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-lg font-medium">
                      {format(currentDate, 'yyyy年 MM月', { locale: ja })}
                    </span>
                    <button
                      onClick={nextMonth}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                  <Info className="w-4 h-4" />
                  <span>1日の学習時間制限: 平日 {dailyTimeLimit.weekday}分 / 休日 {dailyTimeLimit.weekend}分</span>
                </div>

                <div className="grid grid-cols-7 gap-px bg-gray-200">
                  {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                    <div 
                      key={day} 
                      className={`
                        bg-gray-50 p-2 text-center text-sm font-medium
                        ${i === 0 ? 'text-red-600' : i === 6 ? 'text-blue-600' : 'text-gray-700'}
                      `}
                    >
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: getDay(monthStart) }).map((_, index) => (
                    <div key={`empty-start-${index}`} className="bg-gray-50" />
                  ))}
                  {daysInMonth.map(date => {
                    const dayTasks = getTasksForDate(date);
                    const totalTime = getTotalTimeForDate(date);
                    const timeLimit = getDailyLimit(date);
                    const isSelected = isSameDay(date, selectedDate);
                    const isCurrentMonth = isSameMonth(date, currentDate);
                    const isCurrentDay = isToday(date);
                    const isOverLimit = totalTime > timeLimit;
                    const dayOfWeek = getDay(date);

                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => setSelectedDate(date)}
                        className={`
                          bg-white p-3 h-32 text-left transition-colors relative
                          ${!isCurrentMonth && 'text-gray-400 bg-gray-50'}
                          ${isSelected && 'ring-2 ring-indigo-600'}
                          ${isCurrentDay && 'bg-indigo-50'}
                          ${dayOfWeek === 0 ? 'text-red-600' : dayOfWeek === 6 ? 'text-blue-600' : ''}
                          hover:bg-gray-50
                        `}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`
                            text-sm font-medium
                            ${isCurrentDay && 'text-indigo-600'}
                          `}>
                            {format(date, 'd')}
                          </span>
                        </div>

                        {dayTasks.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {dayTasks.map(({ task, requiredTime }) => {
                              const category = categories.find(c => c.id === task.categoryId);
                              const isCompleted = task.completedReviews.some(review => 
                                isSameDay(review.date, date)
                              );
                              
                              return (
                                <div
                                  key={task.id}
                                  className="flex items-center gap-1 text-xs"
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: category?.color }}
                                  />
                                  <span className={`truncate ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                                    {requiredTime}分: {task.title}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="absolute top-2 right-2">
                          <div className={`
                            text-xs font-medium px-1.5 py-0.5 rounded
                            ${isOverLimit ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}
                          `}>
                            {totalTime}/{timeLimit}分
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {Array.from({ length: (7 - ((getDay(monthStart) + daysInMonth.length) % 7)) % 7 }).map((_, index) => (
                    <div key={`empty-end-${index}`} className="bg-gray-50" />
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  {format(selectedDate, 'M月d日', { locale: ja })}のタスク
                </h2>
                <TaskList
                  tasks={getTasksForDate(selectedDate).map(({ task }) => task)}
                  categories={categories}
                  onEditTask={setEditingTask}
                  onDeleteTask={deleteTask}
                  onCompleteTask={completeTask}
                  selectedDate={selectedDate}
                  getRequiredTimeForReview={getRequiredTimeForReview}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <TaskOverview
                tasks={tasks}
                categories={categories}
                onEditTask={setEditingTask}
                onDeleteTask={deleteTask}
                onCompleteTask={completeTask}
                getRequiredTimeForReview={getRequiredTimeForReview}
              />
            </div>
          )}
        </main>

        <Modal
          isOpen={isAddingTask}
          onClose={() => setIsAddingTask(false)}
          title="新規タスクの追加"
        >
          <TaskForm
            onSubmit={addTask}
            onCancel={() => setIsAddingTask(false)}
            categories={categories}
          />
        </Modal>

        <Modal
          isOpen={editingTask !== null}
          onClose={() => setEditingTask(null)}
          title="タスクの編集"
        >
          <TaskForm
            onSubmit={updateTask}
            onCancel={() => setEditingTask(null)}
            initialData={editingTask || undefined}
            categories={categories}
          />
        </Modal>

        <Modal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          title="カテゴリ設定"
        >
          <CategoryManager
            categories={categories}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={deleteCategory}
          />
        </Modal>

        <Modal
          isOpen={showTimeSettings}
          onClose={() => setShowTimeSettings(false)}
          title="学習時間設定"
        >
          <TimeSettings
            dailyTimeLimit={dailyTimeLimit}
            dailyTimeSettings={dailyTimeSettings}
            onSave={setDailyTimeLimit}
            onSaveCustom={(date, timeLimit) => {
              setDailyTimeSettings(prev => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const existing = prev.findIndex(s => s.date === dateStr);
                if (existing >= 0) {
                  return [
                    ...prev.slice(0, existing),
                    { date: dateStr, timeLimit },
                    ...prev.slice(existing + 1)
                  ];
                }
                return [...prev, { date: dateStr, timeLimit }];
              });
            }}
            onDeleteCustom={(date) => {
              setDailyTimeSettings(prev => 
                prev.filter(s => s.date !== format(date, 'yyyy-MM-dd'))
              );
            }}
            onClose={() => setShowTimeSettings(false)}
          />
        </Modal>
      </div>
    </div>
  );
}

export default App;