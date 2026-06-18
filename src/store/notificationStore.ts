import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  
  addNotification: (type: Notification['type'], message: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  addNotification: (type, message) => {
    const id = uuidv4();
    const notification: Notification = {
      id,
      type,
      message,
      timestamp: Date.now(),
    };
    set((state) => ({ notifications: [...state.notifications, notification] }));
    
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 4000);
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}));
