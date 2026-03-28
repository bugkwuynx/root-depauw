export type TaskCategory = 'physical' | 'mental' | 'social' | 'custom';

export interface Task {
  id: string;
  title: string;
  emoji: string;
  category: TaskCategory;
}

export interface SuggestedEvent {
  id: string;
  title: string;
  emoji: string;
  time: string;
  location: string;
  coinBonus: number;
  matchesGoal: boolean;
}

export const mockDailyTasks: Task[] = [
  { id: 't1', title: 'Go for a 20-min walk outside', emoji: '🚶', category: 'physical' },
  { id: 't2', title: 'Meditate for 10 minutes', emoji: '🧘', category: 'mental' },
  { id: 't3', title: 'Call or text a friend', emoji: '💬', category: 'social' },
  { id: 't4', title: 'Drink 8 glasses of water today', emoji: '💧', category: 'physical' },
];

export const mockSuggestedEvents: SuggestedEvent[] = [
  {
    id: 'e1',
    title: 'Yoga Class at the Rec Center',
    emoji: '🧘',
    time: '5:00 PM',
    location: 'Rec Center',
    coinBonus: 20,
    matchesGoal: true,
  },
  {
    id: 'e2',
    title: 'Mental Health Workshop',
    emoji: '🌱',
    time: '3:00 PM',
    location: 'Union Building',
    coinBonus: 20,
    matchesGoal: true,
  },
  {
    id: 'e3',
    title: 'Campus Study Group Session',
    emoji: '📚',
    time: '7:00 PM',
    location: 'Julian Science Library',
    coinBonus: 15,
    matchesGoal: false,
  },
];

export const mockCustomTasks: Task[] = [
  { id: 'c1', title: 'Read for 30 minutes', emoji: '📖', category: 'custom' },
];
