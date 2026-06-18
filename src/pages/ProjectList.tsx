import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  Users, 
  Languages, 
  MoreVertical,
  Play,
  Edit3,
  Trash2,
  Video
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useNotificationStore } from '../store/notificationStore';
import StatusBadge from '../components/ui/StatusBadge';
import { formatDuration } from '../utils/time';
import { LANGUAGE_NAMES } from '../types';
import { cn } from '../lib/utils';

export default function ProjectList() {
  const { projects, deleteProject } = useProjectStore();
  const { addNotification } = useNotificationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string) => {
    deleteProject(id);
    addNotification('success', '项目已删除');
    setActiveMenu(null);
  };

  const getProgress = (project: typeof projects[0]) => {
    const cues = project.subtitles[project.sourceLanguage] || [];
    if (cues.length === 0) return 0;
    const approved = cues.filter(c => c.status === 'approved').length;
    return Math.round((approved / cues.length) * 100);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">
            项目列表
          </h1>
          <p className="text-dark-400 text-sm">
            管理您的视频字幕项目，查看进度和协作状态
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent-600 hover:bg-accent-500 text-white rounded-lg font-medium transition-colors glow-accent"
        >
          <Plus className="w-5 h-5" />
          创建新项目
        </motion.button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="搜索项目名称或描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-white/10 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-dark-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-dark-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-500 transition-colors"
          >
            <option value="all">全部状态</option>
            <option value="processing">处理中</option>
            <option value="editing">校对中</option>
            <option value="translating">翻译中</option>
            <option value="reviewing">审核中</option>
            <option value="completed">已完成</option>
          </select>
        </div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
      >
        <AnimatePresence>
          {filteredProjects.map((project) => {
            const progress = getProgress(project);
            return (
              <motion.div
                key={project.id}
                variants={item}
                layout
                className="group glass-panel rounded-xl overflow-hidden hover:border-accent-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent-500/10"
              >
                <Link to={`/project/${project.id}`} className="block">
                  <div className="relative h-40 bg-dark-900 overflow-hidden">
                    <video
                      src={project.videoUrl}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                      muted
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3">
                      <StatusBadge status={project.status} />
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-2 text-xs text-white/80">
                        <Video className="w-4 h-4" />
                        <span>{formatDuration(project.videoDuration)}</span>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-accent-600/90 flex items-center justify-center backdrop-blur-sm">
                        <Play className="w-6 h-6 text-white ml-1" />
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="p-4 relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === project.id ? null : project.id)}
                    className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-md transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-dark-300" />
                  </button>

                  <AnimatePresence>
                    {activeMenu === project.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-4 top-12 z-10 w-40 bg-dark-700 border border-white/10 rounded-lg shadow-xl overflow-hidden"
                      >
                        <Link
                          to={`/project/${project.id}/editor`}
                          className="flex items-center gap-2 px-4 py-2.5 hover:bg-white/5 text-sm text-white transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          编辑字幕
                        </Link>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-warning-500/10 text-sm text-warning-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          删除项目
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Link to={`/project/${project.id}`} className="block">
                    <h3 className="font-semibold text-white mb-1.5 group-hover:text-accent-400 transition-colors pr-8 line-clamp-1">
                      {project.name}
                    </h3>
                    <p className="text-sm text-dark-400 line-clamp-2 mb-4">
                      {project.description}
                    </p>
                  </Link>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-dark-400">完成进度</span>
                        <span className="text-accent-400 font-medium">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ delay: 0.3, duration: 0.6 }}
                          className={cn(
                            'h-full rounded-full',
                            progress === 100
                              ? 'bg-gradient-to-r from-green-500 to-accent-500'
                              : 'bg-gradient-to-r from-accent-500 to-primary-500'
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-dark-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDuration(project.videoDuration)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{project.members.length}人</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-dark-400">
                        <Languages className="w-3.5 h-3.5" />
                        <span>
                          {LANGUAGE_NAMES[project.sourceLanguage]}
                          {project.targetLanguages.length > 0 && (
                            <> → {project.targetLanguages.map(l => LANGUAGE_NAMES[l]).join('、')}</>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filteredProjects.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-dark-700 flex items-center justify-center">
            <Video className="w-10 h-10 text-dark-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">暂无项目</h3>
          <p className="text-dark-400 text-sm">
            {searchQuery || filterStatus !== 'all'
              ? '没有找到匹配的项目，请调整搜索条件'
              : '点击上方按钮创建您的第一个字幕项目'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
