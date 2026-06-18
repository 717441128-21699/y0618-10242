export interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'editor' | 'translator' | 'reviewer';
  email: string;
}

export interface ReviewInfo {
  reviewerId: string;
  accuracyScore: number;
  fluencyScore: number;
  formatScore: number;
  comments: string;
  reviewedAt: number;
}

export type SubtitleStatus = 
  | 'unclaimed' 
  | 'editing' 
  | 'edited' 
  | 'translating' 
  | 'translated' 
  | 'reviewing' 
  | 'approved' 
  | 'rejected';

export interface SubtitleCue {
  id: string;
  index: number;
  startTime: number;
  endTime: number;
  text: string;
  translation?: string;
  status: SubtitleStatus;
  claimedBy?: string;
  segmentId?: string;
  review?: ReviewInfo;
}

export interface SubtitleSegment {
  id: string;
  startCueIndex: number;
  endCueIndex: number;
  status: 'unclaimed' | 'claimed' | 'completed';
  claimedBy?: string;
  deadline?: number;
}

export type ProjectStatus = 
  | 'uploading' 
  | 'processing' 
  | 'editing' 
  | 'translating' 
  | 'reviewing' 
  | 'completed';

export interface Project {
  id: string;
  name: string;
  description: string;
  videoUrl: string;
  videoDuration: number;
  sourceLanguage: string;
  targetLanguages: string[];
  status: ProjectStatus;
  createdAt: number;
  createdBy: string;
  members: string[];
  subtitles: Record<string, SubtitleCue[]>;
  segments: SubtitleSegment[];
}

export interface ContributorStats {
  userId: string;
  totalLines: number;
  totalProjects: number;
  averageQualityScore: number;
  totalEarnings: number;
  linesEdited: number;
  linesTranslated: number;
  linesReviewed: number;
  qualityScores: number[];
  processedCueIds: string[];
  monthlyStats: {
    month: string;
    lines: number;
    score: number;
    earnings: number;
  }[];
  recentProjects: {
    projectId: string;
    projectName: string;
    lines: number;
    role: string;
    score: number;
  }[];
}

export interface ExportOptions {
  format: 'srt' | 'ass' | 'vtt';
  language: string;
  encoding: 'utf-8' | 'gbk';
  includeStyles?: boolean;
}

export interface BurnOptions {
  language: string;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  position: 'bottom' | 'top' | 'middle';
  resolution: '720p' | '1080p' | '4k';
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
}

export const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'ja': '日本語',
  'ko': '한국어',
  'es': 'Español',
  'fr': 'Français',
  'de': 'Deutsch',
  'ru': 'Русский',
  'ar': 'العربية',
};

export const STATUS_LABELS: Record<SubtitleStatus, string> = {
  unclaimed: '待认领',
  editing: '校对中',
  edited: '校对完成',
  translating: '翻译中',
  translated: '翻译完成',
  reviewing: '审核中',
  approved: '已通过',
  rejected: '已驳回',
};

export const STATUS_COLORS: Record<SubtitleStatus, string> = {
  unclaimed: 'bg-dark-600',
  editing: 'bg-primary-500',
  edited: 'bg-primary-600',
  translating: 'bg-accent-500',
  translated: 'bg-accent-600',
  reviewing: 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-warning-500',
};
