import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Star,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  Award,
  Loader2,
  AlertCircle,
  User,
  BarChart3,
  Clock,
  CheckCircle,
  Medal,
  Target,
  Mail
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from 'recharts';
import { useUserStore } from '../store/userStore';
import { useProjectStore } from '../store/projectStore';
import { LANGUAGE_NAMES } from '../types';
import { cn } from '../lib/utils';

const ROLE_LABELS: Record<string, string> = {
  admin: '项目管理员',
  editor: '字幕编辑员',
  translator: '翻译人员',
  reviewer: '审校人员',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-500',
  editor: 'bg-primary-500',
  translator: 'bg-accent-500',
  reviewer: 'bg-yellow-500',
};

export default function ContributorCenter() {
  const { users, currentUser, fetchContributorStats, contributorStats } = useUserStore();
  const { projects, fetchProjects } = useProjectStore();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(currentUser?.id || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await fetchProjects();
      if (selectedUserId) {
        fetchContributorStats(selectedUserId);
      }
      setLoading(false);
    };
    init();
  }, [selectedUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-accent-500 animate-spin" />
      </div>
    );
  }

  const selectedUser = users.find(u => u.id === selectedUserId) || currentUser;

  if (!selectedUser) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 text-warning-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">用户不存在</h2>
      </div>
    );
  }

  const stats = contributorStats[selectedUser.id];

  const monthlyStats = stats?.monthlyStats?.map(m => ({
    month: m.month,
    lines: m.lines,
    score: m.score,
    earnings: m.earnings,
  })) || [];

  const projectStats = [
    { name: '校对', value: stats?.linesEdited || 0, color: '#3B82F6' },
    { name: '翻译', value: stats?.linesTranslated || 0, color: '#10B981' },
    { name: '审校', value: stats?.linesReviewed || 0, color: '#EAB308' },
  ];

  const recentProjects = stats?.recentProjects || [];

  const leaderboard = users
    .map(u => {
      const s = contributorStats[u.id];
      return {
        ...u,
        totalLines: s?.totalLines || 0,
        avgScore: s ? s.averageQualityScore.toFixed(1) : '0.0',
        earnings: s?.totalEarnings || 0,
      };
    })
    .sort((a, b) => b.totalLines - a.totalLines);

  const currentRank = leaderboard.findIndex(u => u.id === selectedUser.id) + 1;

  const totalLines = stats?.totalLines || 0;
  const avgScore = stats ? stats.averageQualityScore.toFixed(1) : '0.0';
  const totalEarnings = stats?.totalEarnings || 0;

  const getMonthKey = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const currentMonthKey = getMonthKey(new Date());
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthKey = getMonthKey(lastMonthDate);

  const currentMonthEarnings = stats?.monthlyStats?.find(m => m.month === currentMonthKey)?.earnings || 0;
  const lastMonthEarnings = stats?.monthlyStats?.find(m => m.month === lastMonthKey)?.earnings || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-white mb-1">
            贡献者中心
          </h1>
          <p className="text-dark-400 text-sm">查看个人贡献统计与收益明细</p>
        </div>
        <div className="flex items-center gap-2">
          {users.length > 1 && (
            <select
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="px-4 py-2 bg-dark-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-500"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-xl p-5"
        >
          <div className="flex items-start justify-between mb-3">
          <div className="p-2.5 rounded-lg bg-primary-500/20">
            <FileText className="w-5 h-5 text-primary-400" />
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400">
            +12%
          </span>
        </div>
        <p className="text-2xl font-bold text-white">{totalLines}</p>
        <p className="text-sm text-dark-400">累计处理行数</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-xl p-5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-accent-500/20">
              <Star className="w-5 h-5 text-accent-400" />
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-400">
              优秀
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{avgScore}</p>
          <p className="text-sm text-dark-400">平均质量评分</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-xl p-5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-yellow-500/20">
              <DollarSign className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
              ¥{totalEarnings}
            </span>
          </div>
          <p className="text-2xl font-bold text-white">¥{totalEarnings}</p>
          <p className="text-sm text-dark-400">累计收益</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel rounded-xl p-5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-purple-500/20">
              <Trophy className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
              第 {currentRank} 名
            </span>
          </div>
          <p className="text-2xl font-bold text-white">#{currentRank}</p>
          <p className="text-sm text-dark-400">贡献榜排名</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent-400" />
                月度工作量趋势
              </h3>
              <select className="px-3 py-1 bg-dark-700 border border-white/10 rounded-lg text-sm text-white focus:outline-none">
                <option>近6个月</option>
                <option>近12个月</option>
              </select>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyStats}>
                  <defs>
                    <linearGradient id="colorLines" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16C79A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#16C79A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      border: '1px solid #1E293B',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="lines"
                    stroke="#16C79A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLines)"
                    name="处理行数"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel rounded-xl p-4">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-400" />
                工作类型分布
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                    <YAxis stroke="#64748B" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        border: '1px solid #1E293B',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="value" name="行数" radius={[4, 4, 0, 0]}>
                      {projectStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-4">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
                质量评分趋势
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                    <YAxis stroke="#64748B" fontSize={12} domain={[3, 5]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        border: '1px solid #1E293B',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#EAB308"
                      strokeWidth={2}
                      dot={{ fill: '#EAB308', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                      name="评分"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent-400" />
              最近参与项目
            </h3>
            <div className="space-y-3">
              {recentProjects.length === 0 ? (
                <p className="text-sm text-dark-400 text-center py-8">
                  暂无参与项目，开始认领字幕任务后这里会显示
                </p>
              ) : recentProjects.map((project, index) => (
                <motion.div
                  key={project.projectId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-dark-700/50 hover:bg-dark-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-dark-600">
                      <FileText className="w-5 h-5 text-dark-300" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{project.projectName}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full text-white',
                          ROLE_COLORS[project.role]
                        )}>
                          {ROLE_LABELS[project.role]}
                        </span>
                        <span className="text-xs text-dark-400">
                          处理 {project.lines} 行
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-medium text-white">{project.score}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center gap-4 mb-4">
              <img
                src={selectedUser.avatar}
                alt={selectedUser.name}
                className="w-16 h-16 rounded-full border-2 border-accent-500"
              />
              <div>
                <h3 className="font-semibold text-white text-lg">{selectedUser.name}</h3>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full text-white',
                  ROLE_COLORS[selectedUser.role]
                )}>
                  {ROLE_LABELS[selectedUser.role]}
                </span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-dark-400 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  用户名
                </span>
                <span className="text-white">{selectedUser.name}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-dark-400 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  邮箱
                </span>
                <span className="text-white text-xs">{selectedUser.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-dark-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  加入时间
                </span>
                <span className="text-white">2024-01-15</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-dark-400 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  参与项目
                </span>
                <span className="text-white">{recentProjects.length} 个</span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              成就徽章
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Award, label: '新手', color: 'text-accent-400', earned: true },
                { icon: Star, label: '优质', color: 'text-yellow-400', earned: true },
                { icon: CheckCircle, label: '达人', color: 'text-primary-400', earned: true },
                { icon: Trophy, label: '冠军', color: 'text-dark-600', earned: false },
                { icon: TrendingUp, label: '进步', color: 'text-dark-600', earned: false },
                { icon: Medal, label: '大师', color: 'text-dark-600', earned: false },
              ].map((badge, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-xl transition-all',
                    badge.earned ? 'bg-dark-700/50' : 'bg-dark-800/50'
                  )}
                >
                  <badge.icon className={cn('w-6 h-6 mb-1', badge.color, badge.earned && `fill-current`)} />
                  <span className={cn('text-[10px]', badge.earned ? 'text-white' : 'text-dark-500')}>
                    {badge.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Medal className="w-5 h-5 text-accent-400" />
              贡献排行榜
            </h3>
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg transition-colors',
                    user.id === selectedUser.id ? 'bg-accent-500/10 border border-accent-500/30' : 'hover:bg-dark-700/50'
                  )}
                >
                  <span className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-dark-700 text-dark-400'
                  )}>
                    {index + 1}
                  </span>
                  <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium truncate',
                      user.id === selectedUser.id ? 'text-accent-400' : 'text-white'
                    )}>
                      {user.name}
                    </p>
                    <p className="text-[10px] text-dark-400">{user.totalLines} 行</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">¥{user.earnings}</p>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-[10px] text-yellow-400">{user.avgScore}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              收益明细
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">本月预估</span>
                <span className="text-lg font-bold text-green-400">¥{currentMonthEarnings.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">上月结算</span>
                <span className="text-sm text-white">¥{lastMonthEarnings.toFixed(2)}</span>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-400">累计收益</span>
                <span className="text-sm text-white">¥{totalEarnings.toFixed(2)}</span>
              </div>
              <div className="pt-2">
                <div className="text-xs text-dark-400 mb-2">计费规则</div>
                <div className="text-[10px] text-dark-500 space-y-1">
                  <p>• 字幕校对: ¥2.00 / 行</p>
                  <p>• 文本翻译: ¥3.00 / 行</p>
                  <p>• 质量审校: ¥2.50 / 行</p>
                  <p>• 质量奖金: 评分 ≥ 4.5 额外 +10%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
