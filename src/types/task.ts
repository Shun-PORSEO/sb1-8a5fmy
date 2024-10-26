export type TaskCategory = {
  id: string;
  name: string;
  color: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  initialTimeRequired: number;
  createdAt: Date;
  categoryId: string;
  reviewDates: Date[];
  completedReviews: {
    date: Date;
    timeSpent: number;
    actualTime: number;
    retention: number;
  }[];
};

export const DEFAULT_CATEGORIES: TaskCategory[] = [
  { id: '1', name: '語学', color: '#4F46E5' },
  { id: '2', name: 'プログラミング', color: '#059669' },
  { id: '3', name: '資格', color: '#DC2626' },
  { id: '4', name: '趣味', color: '#D97706' },
  { id: '5', name: 'その他', color: '#6B7280' },
];