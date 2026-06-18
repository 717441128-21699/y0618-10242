import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ZoomIn, 
  ZoomOut, 
  Users, 
  Save, 
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useEditorStore } from '../store/editorStore';
import { useUserStore } from '../store/userStore';
import { useNotificationStore } from '../store/notificationStore';
import VideoPlayer from '../components/video/VideoPlayer';
import TimelineTrack from '../components/editor/TimelineTrack';
import SubtitleList from '../components/editor/SubtitleList';
import StatusBadge from '../components/ui/StatusBadge';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useEditorStore as useEditorStoreImport } from '../store/editorStore';

export default function SubtitleEditor() {
  const { id } = useParams<{ id: string }>();
  const { currentProject, loading, updateCue, claimSegment, releaseSegment } = useProjectStore();
  const { currentUser, recordEdit, recordClaim } = useUserStore();
  const { addNotification } = useNotificationStore();
  const { 
    selectedCueId, 
    currentTime, 
    zoomLevel, 
    setSelectedCueId, 
    setZoomLevel,
    showCollaborators,
    setShowCollaborators
  } = useEditorStore();
  const [editedCues, setEditedCues] = useState<Set<string>>(new Set());

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
        <p className="text-dark-400 mb-6">找不到您要编辑的项目</p>
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

  const handleUpdateCueTime = (cueId: string, startTime: number, endTime: number) => {
    updateCue(currentProject.id, currentProject.sourceLanguage, cueId, {
      startTime,
      endTime,
      status: 'editing',
    });
    if (currentUser && !editedCues.has(cueId)) {
      setEditedCues(new Set(editedCues).add(cueId));
      recordEdit(currentUser.id, currentProject.id, currentProject.name, cueId);
    }
  };

  const handleUpdateCue = (cueId: string, updates: Partial<typeof sourceCues[0]>) => {
    updateCue(currentProject.id, currentProject.sourceLanguage, cueId, updates);
    if (currentUser && updates.text !== undefined && !editedCues.has(cueId)) {
      setEditedCues(new Set(editedCues).add(cueId));
      recordEdit(currentUser.id, currentProject.id, currentProject.name, cueId);
    }
  };

  const handleClaimSegment = (segmentId: string) => {
    if (!currentUser) return;
    claimSegment(currentProject.id, segmentId, currentUser.id);
    recordClaim(currentUser.id, currentProject.id, currentProject.name);
    addNotification('success', '已认领该区间，您现在可以开始编辑');
  };

  const handleReleaseSegment = (segmentId: string) => {
    releaseSegment(currentProject.id, segmentId);
    addNotification('info', '已释放该区间');
  };

  const handleSave = () => {
    addNotification('success', '更改已自动保存');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={`/project/${id}`}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-dark-300" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-display font-bold text-white">
                字幕编辑器
              </h1>
              <StatusBadge status={currentProject.status} />
            </div>
            <p className="text-dark-400 text-sm">{currentProject.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-dark-700 rounded-lg">
            <button
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
              className="p-2 hover:bg-white/10 rounded-md transition-colors"
              disabled={zoomLevel <= 0.5}
            >
              <ZoomOut className="w-4 h-4 text-dark-300" />
            </button>
            <span className="text-xs text-dark-400 w-12 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
              className="p-2 hover:bg-white/10 rounded-md transition-colors"
              disabled={zoomLevel >= 3}
            >
              <ZoomIn className="w-4 h-4 text-dark-300" />
            </button>
          </div>
          
          <button
            onClick={() => setShowCollaborators(!showCollaborators)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
              showCollaborators
                ? 'bg-accent-600/20 text-accent-400 border border-accent-500/30'
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
            )}
          >
            <Users className="w-4 h-4" />
            <span className="text-sm">协作者</span>
          </button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-lg font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            保存
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 space-y-4">
          <VideoPlayer
            videoUrl={currentProject.videoUrl}
            onTimeUpdate={(time) => {
              const activeCue = sourceCues.find(
                c => time >= c.startTime && time <= c.endTime
              );
              if (activeCue && selectedCueId !== activeCue.id) {
                setSelectedCueId(activeCue.id);
              }
            }}
          />
          
          <TimelineTrack
            cues={sourceCues}
            duration={currentProject.videoDuration}
            currentTime={currentTime}
            selectedCueId={selectedCueId}
            onSelectCue={setSelectedCueId}
            onUpdateCueTime={handleUpdateCueTime}
            zoomLevel={zoomLevel}
          />
        </div>

        <div className="col-span-2">
          <SubtitleList
            cues={sourceCues}
            segments={currentProject.segments}
            selectedCueId={selectedCueId}
            onSelectCue={setSelectedCueId}
            onUpdateCue={handleUpdateCue}
            onClaimSegment={handleClaimSegment}
            onReleaseSegment={handleReleaseSegment}
            currentUserId={currentUser?.id || ''}
            mode="edit"
          />
        </div>
      </div>

      {showCollaborators && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-xl p-4"
        >
          <h3 className="font-semibold text-white mb-3">在线协作者</h3>
          <div className="flex items-center gap-4">
            {currentProject.members.map((memberId, i) => {
              const user = useUserStore.getState().users.find(u => u.id === memberId);
              if (!user) return null;
              return (
                <motion.div
                  key={memberId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/5"
                >
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent-500 rounded-full border-2 border-dark-800" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-dark-400">
                      {user.role === 'admin' ? '管理员' :
                       user.role === 'editor' ? '编辑中' :
                       user.role === 'translator' ? '翻译中' : '审校中'}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
