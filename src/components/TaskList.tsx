import React, { useState } from 'react';
import { Clock, Edit2, Trash2, CheckCircle2, XCircle, Timer } from 'lucide-react';
import { Task, TaskCategory } from '../types/task';
import { format, isAfter } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Modal } from './Modal';

type TaskListProps = {
  tasks: Task[];
  categories: TaskCategory[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onCompleteTask: (taskId: string, date: Date, completed: boolean, actualTime?: number) => void;
  selectedDate?: Date;
  getRequiredTimeForReview: (task: Task, date: Date) => number;
};

type TimeInputModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (time: number) => void;
  estimatedTime: number;
};

function TimeInputModal({ isOpen, onClose, onSubmit, estimatedTime }: TimeInputModalProps) {
  const [inputValue, setInputValue] = useState(estimatedTime.toString());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setInputValue(value);
    }
  };

  const handleSubmit = () => {
    const time = parseInt(inputValue) || estimatedTime;
    onSubmit(Math.max(1, time));
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="実際の学習時間を入力"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            学習時間（分）
          </label>
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="時間を入力"
            />
            <div className="flex-shrink-0 text-sm text-gray-500">
              予定: {estimatedTime}分
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            記録
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function TaskList({ 
  tasks, 
  categories, 
  onEditTask, 
  onDeleteTask,
  onCompleteTask,
  selectedDate,
  getRequiredTimeForReview
}: TaskListProps) {
  const [timeInputTask, setTimeInputTask] = useState<Task | null>(null);

  if (!selectedDate) {
    return (
      <p className="text-center text-gray-500 py-8">
        日付を選択してください
      </p>
    );
  }

  const totalRequiredTime = tasks.reduce((total, task) => {
    return total + getRequiredTimeForReview(task, selectedDate);
  }, 0);
  
  const completedTasks = tasks.filter(task => 
    task.completedReviews.some(review => 
      format(review.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
    )
  );
  
  const remainingTime = tasks
    .filter(task => !completedTasks.includes(task))
    .reduce((total, task) => {
      return total + getRequiredTimeForReview(task, selectedDate);
    }, 0);

  if (tasks.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">
        予定されているタスクはありません
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100">
          <div className="text-sm text-indigo-600 mb-1">必要復習時間</div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span className="text-xl font-bold text-indigo-600">
              {totalRequiredTime}分
            </span>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-green-50 border border-green-100">
          <div className="text-sm text-green-600 mb-1">残り復習時間</div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-xl font-bold text-green-600">
              {remainingTime}分
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {tasks.map(task => {
          const category = categories.find(c => c.id === task.categoryId);
          const isCompleted = task.completedReviews.some(review => 
            format(review.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
          );
          const reviewCount = task.completedReviews.length;
          const currentReviewTime = getRequiredTimeForReview(task, selectedDate);
          const currentReview = task.completedReviews.find(review => 
            format(review.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
          );
          
          return (
            <div
              key={task.id}
              className={`p-4 rounded-lg border transition-colors ${
                isCompleted
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 hover:border-indigo-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: category?.color }}
                    />
                    <span className="text-sm text-gray-600">{category?.name}</span>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        完了
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 mt-1">{task.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>予定: {currentReviewTime}分</span>
                    </div>
                    {currentReview?.actualTime && (
                      <div className="flex items-center gap-1">
                        <Timer className="w-4 h-4" />
                        <span>実際: {currentReview.actualTime}分</span>
                      </div>
                    )}
                    <div>
                      復習回数: {reviewCount}回
                    </div>
                    <div>
                      作成: {format(task.createdAt, 'M/d', { locale: ja })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => {
                      if (!isCompleted) {
                        setTimeInputTask(task);
                      } else {
                        onCompleteTask(task.id, selectedDate, false);
                      }
                    }}
                    className={`p-1 transition-colors ${
                      isCompleted 
                        ? 'text-green-600 hover:text-green-700' 
                        : 'text-gray-400 hover:text-green-600'
                    }`}
                    title={isCompleted ? 'タスクを未完了に戻す' : 'タスクを完了にする'}
                  >
                    {isCompleted ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => onEditTask(task)}
                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {timeInputTask && selectedDate && (
        <TimeInputModal
          isOpen={true}
          onClose={() => setTimeInputTask(null)}
          onSubmit={(time) => {
            onCompleteTask(timeInputTask.id, selectedDate, true, time);
            setTimeInputTask(null);
          }}
          estimatedTime={getRequiredTimeForReview(timeInputTask, selectedDate)}
        />
      )}
    </div>
  );
}