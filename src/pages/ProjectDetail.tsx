import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  Languages, 
  Clock, 
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Subtitles,
  Edit3,
  Languages as LanguagesIcon,
  FileCheck,
  Download,
  PlayCircle
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import StatusBadge from '../components/ui/StatusBadge';
import { formatDuration } from '../utils/time';
import { LANGUAGE_NAMES } from '../types';
import { useUserStore } from '../store/userStore';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentProject, loading } = useProjectStore();
  const { users } = useUserStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-accent-500 animate-spin" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 text-warning-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">项目不存在</h2>
        <p className="text-dark-400 mb-6">找不到您要查看的项目</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回项目列表
        </Link>
      </div>
    );
  }

  const sourceCues = currentProject.subtitles[currentProject.sourceLanguage] || [];
  const completedCount = sourceCues.filter(c => c.status === 'approved').length;
  const progress = sourceCues.length > 0 ? Math.round((completedCount / sourceCues.length) * 100) : 0;

  const memberUsers = users.filter(u => currentProject.members.includes(u.id));

  const quickActions = [
    { path: 'editor', icon: Edit3, label: '字幕编辑', desc: '校对时间轴与文字', color: 'from-primary-500 to-primary-700' },
    { path: 'translate', icon: LanguagesIcon, label: '翻译工作台', desc: '多语言翻译协作', color: 'from-accent-500 to-accent-700' },
    { path: 'review', icon: FileCheck, label: '审校中心', desc: '质量审核与评分', color: 'from-yellow-500 to-orange-600' },
    { path: 'export', icon: Download, label: '导出中心', desc: '导出字幕文件', color: 'from-purple-500 to-purple-700' },
    { path: 'preview', icon: PlayCircle, label: '预览播放', desc: '多语言字幕预览', color: 'from-pink-500 to-rose-600' },
  ];

  const statCards = [
    { icon: FileText, label: '字幕行数', value: sourceCues.length, color: 'text-primary-400' },
    { icon: CheckCircle2, label: '已完成', value: completedCount, color: 'text-accent-400' },
    { icon: Clock, label: '视频时长', value: formatDuration(currentProject.videoDuration), color: 'text-yellow-400' },
    { icon: Users, label: '团队成员', value: memberUsers.length, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-dark-300" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-display font-bold text-white">
              {currentProject.name}
            </h1>
            <StatusBadge status={currentProject.status} />
          </div>
          <p className="text-dark-400 text-sm">{currentProject.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-panel rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg bg-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-dark-400">{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">项目进度</h2>
              <span className="text-2xl font-bold text-accent-400 font-display">{progress}%</span>
            </div>
            <div className="h-3 bg-dark-600 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-accent-500 to-primary-500 rounded-full"
              />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3 text-center">
              {[
                { label: '待认领', count: sourceCues.filter(c => c.status === 'unclaimed').length, color: 'bg-dark-600' },
                { label: '进行中', count: sourceCues.filter(c => ['editing', 'translating'].includes(c.status)).length, color: 'bg-primary-500' },
                { label: '审核中', count: sourceCues.filter(c => c.status === 'reviewing').length, color: 'bg-yellow-500' },
                { label: '已完成', count: completedCount, color: 'bg-accent-500' },
              ].map((item) => (
                <div key={item.label} className="p-2 rounded-lg bg-white/5">
                  <div className={`w-2 h-2 rounded-full ${item.color} mx-auto mb-1.5`} />
                  <p className="text-xs text-dark-400">{item.label}</p>
                  <p className="text-sm font-semibold text-white">{item.count}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5">
            <h2 className="font-semibold text-white mb-4">快捷操作</h2>
            <div className="grid grid-cols-5 gap-3">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.path}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link
                    to={`/project/${id}/${action.path}`}
                    className="block p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-accent-500/30 transition-all group"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm font-medium text-white mb-0.5">{action.label}</p>
                    <p className="text-xs text-dark-400">{action.desc}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Languages className="w-5 h-5 text-accent-400" />
              <h2 className="font-semibold text-white">语言版本</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent-500/10 border border-accent-500/20">
                <div className="flex items-center gap-2">
                  <Subtitles className="w-4 h-4 text-accent-400" />
                  <span className="text-sm text-white">{LANGUAGE_NAMES[currentProject.sourceLanguage]}</span>
                </div>
                <span className="text-xs text-accent-400 font-medium">源语言</span>
              </div>
              {currentProject.targetLanguages.map((lang) => (
                <div key={lang} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2">
                    <Subtitles className="w-4 h-4 text-dark-400" />
                    <span className="text-sm text-white">{LANGUAGE_NAMES[lang]}</span>
                  </div>
                  <span className="text-xs text-dark-400">目标语言</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary-400" />
              <h2 className="font-semibold text-white">团队成员</h2>
            </div>
            <div className="space-y-3">
              {memberUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-9 h-9 rounded-full border-2 border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-dark-400">
                      {user.role === 'admin' ? '管理员' :
                       user.role === 'editor' ? '字幕编辑' :
                       user.role === 'translator' ? '翻译人员' : '审校人员'}
                    </p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse-slow" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
