import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';

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

type TimeSettingsProps = {
  dailyTimeLimit: {
    weekday: number;
    weekend: number;
  };
  dailyTimeSettings: Array<{
    date: string;
    timeLimit: number;
  }>;
  onSave: (settings: { weekday: number; weekend: number }) => void;
  onSaveCustom: (date: Date, timeLimit: number) => void;
  onDeleteCustom: (date: Date) => void;
  onClose: () => void;
};

export function TimeSettings({ 
  dailyTimeLimit, 
  dailyTimeSettings,
  onSave, 
  onSaveCustom,
  onDeleteCustom,
  onClose 
}: TimeSettingsProps) {
  const [weekday, setWeekday] = useState(dailyTimeLimit.weekday);
  const [weekend, setWeekend] = useState(dailyTimeLimit.weekend);
  const [customDate, setCustomDate] = useState<string>('');
  const [customTime, setCustomTime] = useState<number>(120);

  const handleDefaultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ weekday, weekend });
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customDate) {
      onSaveCustom(new Date(customDate), customTime);
      setCustomDate('');
      setCustomTime(120);
    }
  };

  const formatTimeDisplay = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0
      ? remainingMinutes > 0
        ? `${hours}時間${remainingMinutes}分`
        : `${hours}時間`
      : `${minutes}分`;
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleDefaultSubmit}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">デフォルト設定</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              平日の学習時間制限
            </label>
            <div className="relative">
              <select
                value={weekday}
                onChange={(e) => setWeekday(Number(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-10 py-2"
              >
                {TIME_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              休日の学習時間制限
            </label>
            <div className="relative">
              <select
                value={weekend}
                onChange={(e) => setWeekend(Number(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-10 py-2"
              >
                {TIME_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </form>

      <div className="border-t pt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">カスタム設定</h3>
        <form onSubmit={handleCustomSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                日付
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-10 py-2"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                時間制限
              </label>
              <div className="relative">
                <select
                  value={customTime}
                  onChange={(e) => setCustomTime(Number(e.target.value))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-10 py-2"
                >
                  {TIME_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!customDate}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            カスタム設定を追加
          </button>
        </form>

        {dailyTimeSettings.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">カスタム設定一覧</h4>
            {dailyTimeSettings.map((setting) => (
              <div
                key={setting.date}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {format(new Date(setting.date), 'yyyy年MM月dd日')}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{formatTimeDisplay(setting.timeLimit)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteCustom(new Date(setting.date))}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}