import { create } from 'zustand';
import type { User, ContributorStats } from '../types';

const STORAGE_KEY_USERS = 'subtitle_platform_users';
const STORAGE_KEY_CURRENT = 'subtitle_platform_current_user';
const STORAGE_KEY_STATS = 'subtitle_platform_stats';

const RATE_EDIT = 2.0;
const RATE_TRANSLATE = 3.0;
const RATE_REVIEW = 2.5;

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function createEmptyStats(userId: string): ContributorStats {
  return {
    userId,
    totalLines: 0,
    totalProjects: 0,
    averageQualityScore: 0,
    totalEarnings: 0,
    linesEdited: 0,
    linesTranslated: 0,
    linesReviewed: 0,
    qualityScores: [],
    processedCueIds: [],
    monthlyStats: [],
    recentProjects: [],
  };
}

function persistStats(stats: Record<string, ContributorStats>) {
  localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
}

function loadStats(): Record<string, ContributorStats> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_STATS);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function updateMonthStats(
  stats: ContributorStats,
  linesDelta: number,
  earningsDelta: number,
  score?: number
): ContributorStats {
  const month = currentMonth();
  const monthlyStats = [...stats.monthlyStats];
  const idx = monthlyStats.findIndex(m => m.month === month);
  if (idx >= 0) {
    monthlyStats[idx] = {
      ...monthlyStats[idx],
      lines: monthlyStats[idx].lines + linesDelta,
      earnings: monthlyStats[idx].earnings + earningsDelta,
      score: score !== undefined ? score : monthlyStats[idx].score,
    };
  } else {
    monthlyStats.push({ month, lines: linesDelta, earnings: earningsDelta, score: score ?? 5 });
  }
  return { ...stats, monthlyStats };
}

function updateRecentProjects(
  stats: ContributorStats,
  projectId: string,
  projectName: string,
  role: string,
  linesDelta: number
): ContributorStats {
  const recentProjects = [...stats.recentProjects];
  const idx = recentProjects.findIndex(p => p.projectId === projectId);
  if (idx >= 0) {
    recentProjects[idx] = {
      ...recentProjects[idx],
      lines: recentProjects[idx].lines + linesDelta,
    };
  } else {
    recentProjects.unshift({ projectId, projectName, lines: linesDelta, role, score: 0 });
    if (recentProjects.length > 5) recentProjects.pop();
  }
  return { ...stats, recentProjects };
}

interface UserState {
  users: User[];
  currentUser: User | null;
  contributorStats: Record<string, ContributorStats>;

  fetchUsers: () => void;
  fetchCurrentUser: () => void;
  fetchContributorStats: (userId: string) => void;
  setCurrentUser: (userId: string) => void;

  recordClaim: (userId: string, projectId: string, projectName: string) => void;
  recordEdit: (userId: string, projectId: string, projectName: string, cueId: string) => void;
  recordTranslation: (userId: string, projectId: string, projectName: string, cueId: string) => void;
  recordReview: (userId: string, projectId: string, projectName: string, score: number, approved: boolean) => void;
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

  fetchContributorStats: (_userId: string) => {
    const allStats = loadStats();
    set({ contributorStats: allStats });
  },

  setCurrentUser: (userId: string) => {
    localStorage.setItem(STORAGE_KEY_CURRENT, userId);
    const usersStored = localStorage.getItem(STORAGE_KEY_USERS);
    const users: User[] = usersStored ? JSON.parse(usersStored) : [];
    const currentUser = users.find(u => u.id === userId) || null;
    set({ currentUser });
  },

  recordClaim: (userId, projectId, projectName) => {
    const allStats = loadStats();
    const stats = allStats[userId] || createEmptyStats(userId);
    const updated = updateRecentProjects(stats, projectId, projectName, 'editor', 0);
    allStats[userId] = updated;
    persistStats(allStats);
    set({ contributorStats: allStats });
  },

  recordEdit: (userId, projectId, projectName, cueId) => {
    const allStats = loadStats();
    let stats = allStats[userId] || createEmptyStats(userId);
    if (stats.processedCueIds.includes(`edit-${cueId}`)) return;
    stats = {
      ...stats,
      processedCueIds: [...stats.processedCueIds, `edit-${cueId}`],
      linesEdited: stats.linesEdited + 1,
      totalLines: stats.totalLines + 1,
      totalEarnings: stats.totalEarnings + RATE_EDIT,
    };
    stats = updateRecentProjects(stats, projectId, projectName, 'editor', 1);
    stats = updateMonthStats(stats, 1, RATE_EDIT);
    allStats[userId] = stats;
    persistStats(allStats);
    set({ contributorStats: allStats });
  },

  recordTranslation: (userId, projectId, projectName, cueId) => {
    const allStats = loadStats();
    let stats = allStats[userId] || createEmptyStats(userId);
    if (stats.processedCueIds.includes(`trans-${cueId}`)) return;
    stats = {
      ...stats,
      processedCueIds: [...stats.processedCueIds, `trans-${cueId}`],
      linesTranslated: stats.linesTranslated + 1,
      totalLines: stats.totalLines + 1,
      totalEarnings: stats.totalEarnings + RATE_TRANSLATE,
    };
    stats = updateRecentProjects(stats, projectId, projectName, 'translator', 1);
    stats = updateMonthStats(stats, 1, RATE_TRANSLATE);
    allStats[userId] = stats;
    persistStats(allStats);
    set({ contributorStats: allStats });
  },

  recordReview: (userId, projectId, projectName, score, approved) => {
    const allStats = loadStats();
    let stats = allStats[userId] || createEmptyStats(userId);
    const reviewKey = `review-${projectId}-${Date.now()}`;
    const earnings = approved ? RATE_REVIEW : RATE_REVIEW * 0.5;
    const newScores = [...stats.qualityScores, score];
    const avgScore = newScores.length > 0
      ? newScores.reduce((a, b) => a + b, 0) / newScores.length
      : 0;
    const bonus = avgScore >= 4.5 ? earnings * 0.1 : 0;
    stats = {
      ...stats,
      processedCueIds: [...stats.processedCueIds, reviewKey],
      linesReviewed: stats.linesReviewed + 1,
      totalLines: stats.totalLines + 1,
      qualityScores: newScores,
      averageQualityScore: avgScore,
      totalEarnings: stats.totalEarnings + earnings + bonus,
    };
    stats = updateRecentProjects(stats, projectId, projectName, 'reviewer', 1);
    stats = updateMonthStats(stats, 1, earnings + bonus, avgScore);
    allStats[userId] = stats;
    persistStats(allStats);
    set({ contributorStats: allStats });
  },
}));
