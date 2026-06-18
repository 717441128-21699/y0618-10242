import { create } from 'zustand';
import type { User, ContributorStats } from '../types';

const STORAGE_KEY_USERS = 'subtitle_platform_users';
const STORAGE_KEY_CURRENT = 'subtitle_platform_current_user';
const STORAGE_KEY_STATS = 'subtitle_platform_stats';

interface UserState {
  users: User[];
  currentUser: User | null;
  contributorStats: Record<string, ContributorStats>;
  
  fetchUsers: () => void;
  fetchCurrentUser: () => void;
  fetchContributorStats: (userId: string) => void;
  setCurrentUser: (userId: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  currentUser: null,
  contributorStats: {},

  fetchUsers: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USERS);
      const users = stored ? JSON.parse(stored) : [];
      set({ users });
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  },

  fetchCurrentUser: () => {
    try {
      const userId = localStorage.getItem(STORAGE_KEY_CURRENT);
      const usersStored = localStorage.getItem(STORAGE_KEY_USERS);
      const users: User[] = usersStored ? JSON.parse(usersStored) : [];
      const currentUser = users.find(u => u.id === userId) || users[0] || null;
      set({ currentUser });
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  },

  fetchContributorStats: (userId: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_STATS);
      const allStats: Record<string, ContributorStats> = stored ? JSON.parse(stored) : {};
      set({ contributorStats: allStats });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },

  setCurrentUser: (userId: string) => {
    localStorage.setItem(STORAGE_KEY_CURRENT, userId);
    const usersStored = localStorage.getItem(STORAGE_KEY_USERS);
    const users: User[] = usersStored ? JSON.parse(usersStored) : [];
    const currentUser = users.find(u => u.id === userId) || null;
    set({ currentUser });
  },
}));
