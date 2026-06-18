import { v4 as uuidv4 } from 'uuid';
import type { User, Project, SubtitleCue, SubtitleSegment, ContributorStats } from '../types';

const enSamples = [
  "Welcome to today's presentation on artificial intelligence.",
  "We'll explore how machine learning is transforming our world.",
  "The future of technology holds incredible promise for humanity.",
  "Let's start by understanding the basics of neural networks.",
  "Deep learning has revolutionized computer vision and natural language processing.",
  "Every day, new breakthroughs push the boundaries of what's possible.",
  "Ethical considerations must guide our development of these powerful tools.",
  "Collaboration between humans and AI is the key to success.",
  "Let me show you some fascinating examples of AI in action.",
  "The potential applications are limited only by our imagination.",
  "We need to think carefully about the societal impact of automation.",
  "Education and training programs must adapt to the changing job market.",
  "Research institutions are at the forefront of innovation.",
  "Industry partnerships accelerate the pace of discovery.",
  "Let's discuss the challenges we face in implementing these solutions.",
  "Scalability and efficiency are critical considerations.",
  "The democratization of AI technology empowers creators worldwide.",
  "Transparency in algorithms builds trust with users.",
  "Privacy protection must be a fundamental design principle.",
  "Looking ahead, the possibilities are truly exciting.",
];

const zhSamples = [
  "欢迎参加今天关于人工智能的演讲。",
  "我们将探讨机器学习如何改变我们的世界。",
  "技术的未来为人类带来了难以置信的希望。",
  "让我们从理解神经网络的基础开始。",
  "深度学习彻底改变了计算机视觉和自然语言处理。",
  "每天都有新的突破推动着可能性的边界。",
  "伦理考量必须指导我们开发这些强大的工具。",
  "人类与人工智能的协作是成功的关键。",
  "让我向您展示一些人工智能应用的精彩案例。",
  "潜在的应用仅受限于我们的想象力。",
  "我们需要仔细思考自动化对社会的影响。",
  "教育和培训计划必须适应不断变化的就业市场。",
  "研究机构站在创新的最前沿。",
  "行业合作加速了发现的步伐。",
  "让我们讨论在实施这些解决方案时面临的挑战。",
  "可扩展性和效率是关键考虑因素。",
  "人工智能技术的民主化赋予了全球创作者权力。",
  "算法的透明度建立了用户的信任。",
  "隐私保护必须是基本的设计原则。",
  "展望未来，可能性确实令人兴奋。",
];

export const mockUsers: User[] = [
  {
    id: 'user-001',
    name: '张明',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',
    role: 'admin',
    email: 'zhang@example.com',
  },
  {
    id: 'user-002',
    name: '李华',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li',
    role: 'editor',
    email: 'li@example.com',
  },
  {
    id: 'user-003',
    name: '王芳',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
    role: 'translator',
    email: 'wang@example.com',
  },
  {
    id: 'user-004',
    name: '陈伟',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chen',
    role: 'reviewer',
    email: 'chen@example.com',
  },
  {
    id: 'user-005',
    name: '刘洋',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liu',
    role: 'translator',
    email: 'liu@example.com',
  },
];

function generateMockSubtitles(count: number, lang: string): SubtitleCue[] {
  const samples = lang === 'en' ? enSamples : zhSamples;
  return Array.from({ length: count }, (_, i) => ({
    id: `cue-${i + 1}`,
    index: i + 1,
    startTime: i * 8000 + Math.floor(Math.random() * 500),
    endTime: (i + 1) * 8000 - 100 + Math.floor(Math.random() * 500),
    text: samples[i % samples.length],
    translation: lang !== 'en' ? samples[i % samples.length] : undefined,
    status: i < count * 0.3 ? 'approved' : i < count * 0.5 ? 'translated' : i < count * 0.7 ? 'edited' : 'unclaimed',
    claimedBy: i < count * 0.5 ? `user-${String((i % 4) + 2).padStart(3, '0')}` : undefined,
    segmentId: `seg-${Math.floor(i / 10) + 1}`,
  }));
}

function generateMockSegments(cueCount: number, segmentSize: number): SubtitleSegment[] {
  const segments: SubtitleSegment[] = [];
  for (let i = 0; i < cueCount; i += segmentSize) {
    const segIndex = Math.floor(i / segmentSize);
    segments.push({
      id: `seg-${segIndex + 1}`,
      startCueIndex: i,
      endCueIndex: Math.min(i + segmentSize - 1, cueCount - 1),
      status: segIndex < 3 ? 'completed' : segIndex < 5 ? 'claimed' : 'unclaimed',
      claimedBy: segIndex < 5 ? `user-${String((segIndex % 4) + 2).padStart(3, '0')}` : undefined,
      deadline: Date.now() + 86400000 * 2,
    });
  }
  return segments;
}

export const mockProjects: Project[] = [
  {
    id: 'proj-001',
    name: 'TED演讲：人工智能的未来',
    description: '2024年TED大会主题演讲，探讨人工智能的发展趋势与社会影响。需要翻译成中英日韩四语字幕。',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    videoDuration: 1234000,
    sourceLanguage: 'en',
    targetLanguages: ['zh-CN', 'ja', 'ko'],
    status: 'translating',
    createdAt: Date.now() - 86400000 * 3,
    createdBy: 'user-001',
    members: ['user-001', 'user-002', 'user-003', 'user-004'],
    subtitles: {
      'en': generateMockSubtitles(60, 'en'),
      'zh-CN': generateMockSubtitles(60, 'zh-CN'),
    },
    segments: generateMockSegments(60, 10),
  },
  {
    id: 'proj-002',
    name: '产品教程：快速入门指南',
    description: '新产品功能介绍视频，面向全球用户，需要多语言字幕支持。',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    videoDuration: 540000,
    sourceLanguage: 'zh-CN',
    targetLanguages: ['en', 'ja', 'es'],
    status: 'editing',
    createdAt: Date.now() - 86400000,
    createdBy: 'user-001',
    members: ['user-001', 'user-002', 'user-005'],
    subtitles: {
      'zh-CN': generateMockSubtitles(35, 'zh-CN'),
      'en': generateMockSubtitles(35, 'en'),
    },
    segments: generateMockSegments(35, 7),
  },
  {
    id: 'proj-003',
    name: '纪录片：海洋深处的奥秘',
    description: '自然纪录片系列，展现深海生物的奇妙世界。已完成翻译，待审核。',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    videoDuration: 2700000,
    sourceLanguage: 'en',
    targetLanguages: ['zh-CN'],
    status: 'reviewing',
    createdAt: Date.now() - 86400000 * 7,
    createdBy: 'user-001',
    members: ['user-001', 'user-003', 'user-004'],
    subtitles: {
      'en': generateMockSubtitles(120, 'en'),
      'zh-CN': generateMockSubtitles(120, 'zh-CN'),
    },
    segments: generateMockSegments(120, 15),
  },
  {
    id: 'proj-004',
    name: '在线课程：数据科学基础',
    description: 'MOOC课程系列，共12讲，需要完整的字幕本地化。',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    videoDuration: 4500000,
    sourceLanguage: 'en',
    targetLanguages: ['zh-CN', 'ja'],
    status: 'completed',
    createdAt: Date.now() - 86400000 * 14,
    createdBy: 'user-001',
    members: ['user-001', 'user-002', 'user-003', 'user-004', 'user-005'],
    subtitles: {
      'en': generateMockSubtitles(200, 'en'),
      'zh-CN': generateMockSubtitles(200, 'zh-CN'),
    },
    segments: generateMockSegments(200, 20),
  },
];

export const mockContributorStats: Record<string, ContributorStats> = {
  'user-001': {
    userId: 'user-001',
    totalLines: 1250,
    totalProjects: 8,
    averageQualityScore: 92.5,
    totalEarnings: 2450.50,
    linesEdited: 480,
    linesTranslated: 530,
    linesReviewed: 240,
    qualityScores: [4.5, 4.7, 4.6, 4.8, 4.9],
    processedCueIds: [],
    monthlyStats: [
      { month: '2026-01', lines: 180, score: 90, earnings: 360 },
      { month: '2026-02', lines: 220, score: 91.5, earnings: 440 },
      { month: '2026-03', lines: 280, score: 93, earnings: 560 },
      { month: '2026-04', lines: 310, score: 92, earnings: 620 },
      { month: '2026-05', lines: 260, score: 94, earnings: 520 },
      { month: '2026-06', lines: 240, score: 92.5, earnings: 480 },
    ],
    recentProjects: [
      { projectId: 'proj-004', projectName: '在线课程：数据科学基础', lines: 400, role: 'admin', score: 95 },
      { projectId: 'proj-003', projectName: '纪录片：海洋深处的奥秘', lines: 280, role: 'editor', score: 93 },
      { projectId: 'proj-001', projectName: 'TED演讲：人工智能的未来', lines: 150, role: 'admin', score: 92 },
    ],
  },
  'user-003': {
    userId: 'user-003',
    totalLines: 890,
    totalProjects: 5,
    averageQualityScore: 88.7,
    totalEarnings: 1567.80,
    linesEdited: 0,
    linesTranslated: 890,
    linesReviewed: 0,
    qualityScores: [4.2, 4.5, 4.4, 4.6, 4.3],
    processedCueIds: [],
    monthlyStats: [
      { month: '2026-01', lines: 120, score: 85, earnings: 360 },
      { month: '2026-02', lines: 150, score: 87, earnings: 450 },
      { month: '2026-03', lines: 180, score: 89, earnings: 540 },
      { month: '2026-04', lines: 200, score: 90, earnings: 600 },
      { month: '2026-05', lines: 170, score: 88, earnings: 510 },
      { month: '2026-06', lines: 170, score: 92, earnings: 510 },
    ],
    recentProjects: [
      { projectId: 'proj-004', projectName: '在线课程：数据科学基础', lines: 320, role: 'translator', score: 90 },
      { projectId: 'proj-003', projectName: '纪录片：海洋深处的奥秘', lines: 250, role: 'translator', score: 88 },
      { projectId: 'proj-001', projectName: 'TED演讲：人工智能的未来', lines: 180, role: 'translator', score: 89 },
    ],
  },
};

const STORAGE_KEY_PROJECTS = 'subtitle_platform_projects';
const STORAGE_KEY_USERS = 'subtitle_platform_users';
const STORAGE_KEY_CURRENT_USER = 'subtitle_platform_current_user';
const STORAGE_KEY_STATS = 'subtitle_platform_stats';

export function initializeMockData(): void {
  if (!localStorage.getItem(STORAGE_KEY_PROJECTS)) {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(mockProjects));
  }
  if (!localStorage.getItem(STORAGE_KEY_USERS)) {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(mockUsers));
  }
  if (!localStorage.getItem(STORAGE_KEY_CURRENT_USER)) {
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, 'user-001');
  }
  if (!localStorage.getItem(STORAGE_KEY_STATS)) {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(mockContributorStats));
  }
}

export function generateNewProject(name: string, description: string, videoUrl: string, duration: number, sourceLang: string, targetLangs: string[]): Project {
  const cueCount = Math.max(20, Math.floor(duration / 8000));
  const sourceCues = generateMockSubtitles(cueCount, sourceLang);

  const subtitles: Record<string, SubtitleCue[]> = {
    [sourceLang]: sourceCues,
  };

  targetLangs.forEach((lang) => {
    if (lang !== sourceLang) {
      subtitles[lang] = sourceCues.map((cue) => ({
        ...cue,
        text: '',
        translation: undefined,
        status: 'unclaimed' as const,
        claimedBy: undefined,
        review: undefined,
      }));
    }
  });

  return {
    id: uuidv4(),
    name,
    description,
    videoUrl,
    videoDuration: duration,
    sourceLanguage: sourceLang,
    targetLanguages: targetLangs,
    status: 'editing',
    createdAt: Date.now(),
    createdBy: localStorage.getItem(STORAGE_KEY_CURRENT_USER) || 'user-001',
    members: [localStorage.getItem(STORAGE_KEY_CURRENT_USER) || 'user-001'],
    subtitles,
    segments: generateMockSegments(cueCount, Math.max(5, Math.floor(cueCount / 10))),
  };
}
