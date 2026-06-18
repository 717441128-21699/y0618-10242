import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload, 
  Subtitles, 
  Languages, 
  FileCheck, 
  Download, 
  User, 
  PlayCircle,
  Settings,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useUserStore } from '../../store/userStore';
import { cn } from '../../lib/utils';

interface SidebarProps {
  projectId?: string;
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '项目列表' },
];

const projectNavItems = [
  { path: '/project/:id', icon: LayoutDashboard, label: '项目概览' },
  { path: '/project/:id/upload', icon: Upload, label: '视频上传' },
  { path: '/project/:id/editor', icon: Subtitles, label: '字幕编辑' },
  { path: '/project/:id/translate', icon: Languages, label: '翻译工作台' },
  { path: '/project/:id/review', icon: FileCheck, label: '审校中心' },
  { path: '/project/:id/export', icon: Download, label: '导出中心' },
  { path: '/project/:id/preview', icon: PlayCircle, label: '预览播放' },
];

export default function Sidebar({ projectId }: SidebarProps) {
  const location = useLocation();
  const { currentUser } = useUserStore();

  const isActive = (path: string) => {
    if (projectId) {
      const fullPath = path.replace(':id', projectId);
      return location.pathname === fullPath;
    }
    return location.pathname === path;
  };

  const getPath = (path: string) => {
    return projectId ? path.replace(':id', projectId) : path;
  };

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-64 h-screen bg-dark-800 border-r border-white/10 flex flex-col fixed left-0 top-0 z-40"
    >
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-500 to-primary-600 flex items-center justify-center glow-accent">
            <Subtitles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-white">SubFlow</h1>
            <p className="text-xs text-dark-400">字幕协作平台</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
        <div className="mb-4">
          <p className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-2 px-3">
            工作台
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={getPath(item.path)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                isActive(item.path)
                  ? 'bg-accent-600/20 text-accent-400 border border-accent-500/30'
                  : 'text-dark-300 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive(item.path) && (
                <ChevronRight className="w-4 h-4 ml-auto" />
              )}
            </NavLink>
          ))}
        </div>

        {projectId && (
          <div className="mb-4">
            <p className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-2 px-3">
              项目管理
            </p>
            {projectNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={getPath(item.path)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                  isActive(item.path)
                    ? 'bg-accent-600/20 text-accent-400 border border-accent-500/30'
                    : 'text-dark-300 hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
                {isActive(item.path) && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </NavLink>
            ))}
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-2 px-3">
            个人中心
          </p>
          <NavLink
            to="/contributor"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
              location.pathname === '/contributor'
                ? 'bg-accent-600/20 text-accent-400 border border-accent-500/30'
                : 'text-dark-300 hover:text-white hover:bg-white/5'
            )}
          >
            <User className="w-5 h-5" />
            <span className="text-sm font-medium">贡献者中心</span>
            {location.pathname === '/contributor' && (
              <ChevronRight className="w-4 h-4 ml-auto" />
            )}
          </NavLink>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-dark-300 hover:text-white hover:bg-white/5 transition-all duration-200">
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">设置</span>
          </button>
        </div>
      </nav>

      {currentUser && (
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full border-2 border-accent-500/50"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-dark-400 truncate">
                {currentUser.role === 'admin' ? '管理员' :
                 currentUser.role === 'editor' ? '字幕编辑' :
                 currentUser.role === 'translator' ? '翻译人员' : '审校人员'}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
