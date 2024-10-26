import React, { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight, Calendar, PieChart as PieChartIcon } from 'lucide-react';
import { Task, TaskCategory } from '../types/task';

type TaskAnalysisProps = {
  tasks: Task[];
  categories: TaskCategory[];
  getRequiredTimeForReview: (task: Task, date: Date) => number;
};

type MonthlyData = {
  month: string;
  total: number;
  [key: string]: number | string;
};

const minutesToHours = (minutes: number) => Number((minutes / 60).toFixed(1));
const formatHours = (hours: number) => `${hours}時間`;

export function TaskAnalysis({ tasks, categories, getRequiredTimeForReview }: TaskAnalysisProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const months = useMemo(() => {
    const endDate = endOfMonth(currentDate);
    const startDate = startOfMonth(subMonths(currentDate, 5));
    return eachMonthOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const data: MonthlyData[] = useMemo(() => {
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthData: MonthlyData = {
        month: format(month, 'yyyy年M月', { locale: ja }),
        total: 0,
      };

      categories.forEach(category => {
        let categoryTotal = 0;
        
        tasks.forEach(task => {
          task.reviewDates
            .filter(date => date >= monthStart && date <= monthEnd)
            .forEach(date => {
              if (task.categoryId === category.id) {
                categoryTotal += getRequiredTimeForReview(task, date);
              }
            });
        });

        monthData[category.id] = minutesToHours(categoryTotal);
        monthData.total += minutesToHours(categoryTotal);
      });

      return monthData;
    });
  }, [months, tasks, categories, getRequiredTimeForReview]);

  const moveMonths = (direction: 'prev' | 'next') => {
    setCurrentDate(current => 
      direction === 'prev' 
        ? subMonths(current, 6) 
        : addMonths(current, 6)
    );
  };

  const totalTime = data.reduce((sum, month) => sum + month.total, 0);
  const averageTimePerMonth = Number((totalTime / data.length).toFixed(1));

  const categoryTotals = categories.map(category => ({
    category,
    total: data.reduce((sum, month) => sum + (month[category.id] as number), 0),
  }));

  // Y軸の最大値を計算（データの最大値を基に適切な目盛りを設定）
  const maxTotal = Math.max(...data.map(month => month.total));
  const yAxisMax = Math.ceil(maxTotal / 4) * 4; // 4時間単位で切り上げ
  const yAxisTicks = Array.from(
    { length: Math.floor(yAxisMax / 4) + 1 },
    (_, i) => i * 4
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <PieChartIcon className="w-6 h-6 text-indigo-600" />
          月別タスク分析
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => moveMonths('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="前の6ヶ月"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">
              {format(months[0], 'yyyy年M月', { locale: ja })} - {format(months[months.length - 1], 'yyyy年M月', { locale: ja })}
            </span>
          </div>
          <button
            onClick={() => moveMonths('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="次の6ヶ月"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-2 bg-white p-6 rounded-xl border border-gray-200">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="month"
                  tickMargin={10}
                />
                <YAxis 
                  unit="時間"
                  domain={[0, yAxisMax]}
                  ticks={yAxisTicks}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const category = categories.find(c => c.id === name);
                    return [formatHours(value), category?.name || name];
                  }}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                />
                <Legend
                  formatter={(value: string) => {
                    const category = categories.find(c => c.id === value);
                    return category?.name || value;
                  }}
                />
                {categories.map(category => (
                  <Bar
                    key={category.id}
                    dataKey={category.id}
                    stackId="a"
                    fill={category.color}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">期間サマリー</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">合計学習時間</div>
                <div className="text-2xl font-bold text-gray-900">{formatHours(totalTime)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">月平均学習時間</div>
                <div className="text-2xl font-bold text-gray-900">{formatHours(averageTimePerMonth)}</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">カテゴリ別合計</h3>
            <div className="space-y-3">
              {categoryTotals
                .sort((a, b) => b.total - a.total)
                .map(({ category, total }) => (
                  <div key={category.id} className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {category.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatHours(total)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${(total / totalTime) * 100}%`,
                            backgroundColor: category.color
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}