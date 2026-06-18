import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Languages, 
  BookOpen, 
  Save,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Globe
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useUserStore } from '../store/userStore';
import { useNotificationStore } from '../store/notificationStore';
import { useEditorStore } from '../store/editorStore';
import StatusBadge from '../components/ui/StatusBadge';
import { LANGUAGE_NAMES, STATUS_LABELS, STATUS_COLORS } from '../types';
import { formatTime } from '../utils/time';
import VideoPlayer from '../components/video/VideoPlayer';
import { cn } from '../lib/utils';

export default function TranslateWorkbench() {
  const { id } = useParams<{ id: string }>();
  const { currentProject, loading, updateTranslation, claimSegment, releaseSegment, ensureTargetLanguage, completeSegment } = useProjectStore();
  const { currentUser, users, recordTranslation } = useUserStore();
  const { addNotification } = useNotificationStore();
  const { setSelectedCueId, selectedCueId } = useEditorStore();
  
  const [targetLanguage, setTargetLanguage] = useState('zh-CN');
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const [lastSavedCueId, setLastSavedCueId] = useState<string | null>(null);
  const [lastSavedLang, setLastSavedLang] = useState<string | null>(null);

  useEffect(() => {
    if (currentProject) {
      ensureTargetLanguage(currentProject.id, targetLanguage);
    }
  }, [currentProject, targetLanguage, ensureTargetLanguage]);

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
  const targetCues = currentProject.subtitles[targetLanguage] || [];

  const getTargetCue = (cueId: string) => targetCues.find(c => c.id === cueId);

  const selectedCue = sourceCues.find(c => c.id === selectedCueId) || sourceCues[0];
  const selectedTargetCue = selectedCue ? getTargetCue(selectedCue.id) : undefined;

  // Sync draft text when selected cue or language changes
  useEffect(() => {
    if (selectedTargetCue) {
      setDraftText(selectedTargetCue.text || '');
    } else {
      setDraftText('');
    }
    setLastSavedCueId(null);
    setLastSavedLang(null);
  }, [selectedCue?.id, targetLanguage]);

  const handleDraftChange = (value: string) => {
    setDraftText(value);
    if (selectedCue) {
      updateTranslation(currentProject.id, targetLanguage, selectedCue.id, value, 'translating');
    }
  };

  const handleBlurSave = () => {
    if (!selectedCue) return;
    const trimmed = draftText.trim();
    if (trimmed) {
      updateTranslation(currentProject.id, targetLanguage, selectedCue.id, trimmed, 'translated');
      if (currentUser && (lastSavedCueId !== selectedCue.id || lastSavedLang !== targetLanguage)) {
        recordTranslation(currentUser.id, currentProject.id, currentProject.name, selectedCue.id);
        setLastSavedCueId(selectedCue.id);
        setLastSavedLang(targetLanguage);
      }
    }
  };

  const handleClaimSegment = (segmentId: string) => {
    if (!currentUser) return;
    claimSegment(currentProject.id, segmentId, currentUser.id);
    setActiveSegmentId(segmentId);
    addNotification('success', '已认领该翻译区间');
  };

  const handleReleaseSegment = (segmentId: string) => {
    releaseSegment(currentProject.id, segmentId);
    setActiveSegmentId(null);
    addNotification('info', '已释放该区间');
  };

  const handleCompleteSegment = (segmentId: string) => {
    completeSegment(currentProject.id, segmentId);
    addNotification('success', '区间标记为已完成');
  };

  const handleSave = () => {
    handleBlurSave();
    addNotification('success', '翻译已保存');
  };

  const navigateCue = (direction: 'prev' | 'next') => {
    const currentIndex = sourceCues.findIndex(c => c.id === selectedCue?.id);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedCueId(sourceCues[currentIndex - 1].id);
    } else if (direction === 'next' && currentIndex < sourceCues.length - 1) {
      setSelectedCueId(sourceCues[currentIndex + 1].id);
    }
  };

  const getContextCues = (currentId: string) => {
    const currentIndex = sourceCues.findIndex(c => c.id === currentId);
    return {
      prev: currentIndex > 0 ? sourceCues[currentIndex - 1] : null,
      prevTarget: currentIndex > 0 ? getTargetCue(sourceCues[currentIndex - 1].id) : null,
      next: currentIndex < sourceCues.length - 1 ? sourceCues[currentIndex + 1] : null,
      nextTarget: currentIndex < sourceCues.length - 1 ? getTargetCue(sourceCues[currentIndex + 1].id) : null,
    };
  };

  const canEditSegment = (segmentId: string) => {
    const segment = currentProject.segments.find(s => s.id === segmentId);
    return segment && segment.claimedBy === currentUser?.id;
  };

  const termLibrary = [
    { source: 'Artificial Intelligence', target: '人工智能' },
    { source: 'Machine Learning', target: '机器学习' },
    { source: 'Deep Learning', target: '深度学习' },
    { source: 'Neural Network', target: '神经网络' },
    { source: 'Natural Language Processing', target: '自然语言处理' },
  ];

  const { prev: prevCue, prevTarget, next: nextCue, nextTarget } = selectedCue ? getContextCues(selectedCue.id) : { prev: null, prevTarget: null, next: null, nextTarget: null };

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
                翻译工作台
              </h1>
              <StatusBadge status={currentProject.status} />
            </div>
            <p className="text-dark-400 text-sm">{currentProject.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-dark-700 rounded-lg">
            <Globe className="w-4 h-4 text-dark-400" />
            <span className="text-sm text-dark-300">
              {LANGUAGE_NAMES[currentProject.sourceLanguage]} →
            </span>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="bg-transparent text-accent-400 text-sm font-medium focus:outline-none"
            >
              {currentProject.targetLanguages.map((lang) => (
                <option key={lang} value={lang} className="bg-dark-700">
                  {LANGUAGE_NAMES[lang]}
                </option>
              ))}
            </select>
          </div>

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

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-primary-400" />
                <h3 className="font-semibold text-white">原文 ({LANGUAGE_NAMES[currentProject.sourceLanguage]})</h3>
              </div>

              {prevCue && (
                <div className="mb-3 p-3 rounded-lg bg-dark-700/30 opacity-60">
                  <p className="text-xs text-dark-400 mb-1">{formatTime(prevCue.startTime)}</p>
                  <p className="text-sm text-dark-300">{prevCue.text}</p>
                </div>
              )}

              {selectedCue && (
                <motion.div
                  key={`${selectedCue.id}-${targetLanguage}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/30 mb-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-primary-400">
                      {formatTime(selectedCue.startTime)} → {formatTime(selectedCue.endTime)}
                    </span>
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded text-white',
                      STATUS_COLORS[selectedCue.status]
                    )}>
                      {STATUS_LABELS[selectedCue.status]}
                    </span>
                  </div>
                  <p className="text-lg text-white leading-relaxed">{selectedCue.text}</p>
                </motion.div>
              )}

              {nextCue && (
                <div className="p-3 rounded-lg bg-dark-700/30 opacity-60">
                  <p className="text-xs text-dark-400 mb-1">{formatTime(nextCue.startTime)}</p>
                  <p className="text-sm text-dark-300">{nextCue.text}</p>
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => navigateCue('prev')}
                  disabled={!prevCue}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-dark-700 text-dark-300 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一句
                </button>
                <span className="text-sm text-dark-400">
                  {selectedCue ? selectedCue.index : 0} / {sourceCues.length}
                </span>
                <button
                  onClick={() => navigateCue('next')}
                  disabled={!nextCue}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-dark-700 text-dark-300 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  下一句
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Languages className="w-5 h-5 text-accent-400" />
                <h3 className="font-semibold text-white">译文 ({LANGUAGE_NAMES[targetLanguage]})</h3>
              </div>

              {prevCue && prevTarget && prevTarget.text && (
                <div className="mb-3 p-3 rounded-lg bg-dark-700/30 opacity-60">
                  <p className="text-xs text-dark-400 mb-1">上句译文</p>
                  <p className="text-sm text-dark-300">{prevTarget.text}</p>
                </div>
              )}

              {selectedCue && (
                <motion.div
                  key={`trans-${selectedCue.id}-${targetLanguage}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-3"
                >
                  <textarea
                    value={draftText}
                    onChange={(e) => handleDraftChange(e.target.value)}
                    onBlur={handleBlurSave}
                    rows={4}
                    className="w-full p-4 rounded-xl bg-accent-500/10 border border-accent-500/30 text-accent-400 placeholder-dark-500 focus:outline-none focus:border-accent-500 transition-colors resize-none text-lg leading-relaxed"
                    placeholder="在此输入译文..."
                    autoFocus
                  />
                  {selectedTargetCue && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded text-white',
                        STATUS_COLORS[selectedTargetCue.status]
                      )}>
                        {STATUS_LABELS[selectedTargetCue.status]}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}

              {nextCue && nextTarget && nextTarget.text && (
                <div className="p-3 rounded-lg bg-dark-700/30 opacity-60">
                  <p className="text-xs text-dark-400 mb-1">下句译文</p>
                  <p className="text-sm text-dark-300">{nextTarget.text}</p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-xs text-dark-400">
                <span>字数: {draftText.length}</span>
                <span>失焦自动保存当前语言译文</span>
              </div>
            </div>
          </div>

          <VideoPlayer
            videoUrl={currentProject.videoUrl}
            onTimeUpdate={(time) => {
              const activeCue = sourceCues.find(
                c => time >= c.startTime && time <= c.endTime
              );
              if (activeCue && activeCue.id !== selectedCueId) {
                setSelectedCueId(activeCue.id);
              }
            }}
          />

          <div className="glass-panel rounded-xl p-4">
            <h3 className="font-semibold text-white mb-3">翻译术语库</h3>
            <div className="grid grid-cols-2 gap-2">
              {termLibrary.map((term, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-colors cursor-pointer group"
                  onClick={() => {
                    if (selectedCue) {
                      const newText = draftText + term.target;
                      handleDraftChange(newText);
                    }
                  }}
                >
                  <p className="text-xs text-dark-400">{term.source}</p>
                  <p className="text-sm text-accent-400 group-hover:text-accent-300">{term.target}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin pr-2">
          {currentProject.segments.map((segment, index) => {
            const segmentCues = sourceCues.filter(
              c => c.index >= segment.startCueIndex && c.index <= segment.endCueIndex
            );
            const claimedUser = users.find(u => u.id === segment.claimedBy);
            const canEdit = canEditSegment(segment.id);
            const isActive = activeSegmentId === segment.id;

            return (
              <motion.div
                key={segment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  'glass-panel rounded-xl overflow-hidden transition-all',
                  isActive && 'ring-2 ring-accent-500'
                )}
              >
                <div className="p-3 border-b border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">
                      区间 {index + 1}: 第 {segment.startCueIndex + 1}-{segment.endCueIndex + 1} 行
                    </span>
                    <span className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full text-white',
                      segment.status === 'completed' ? 'bg-accent-500' :
                      segment.status === 'claimed' ? 'bg-primary-500' : 'bg-dark-600'
                    )}>
                      {segment.status === 'completed' ? '已完成' :
                       segment.status === 'claimed' ? '认领中' : '待认领'}
                    </span>
                  </div>
                  {claimedUser && (
                    <div className="flex items-center gap-2 text-xs text-dark-400">
                      <img src={claimedUser.avatar} alt="" className="w-5 h-5 rounded-full" />
                      <span>{claimedUser.name}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                  {segmentCues.map((cue) => {
                    const tc = getTargetCue(cue.id);
                    return (
                      <div
                        key={cue.id}
                        onClick={() => {
                          if (canEdit) {
                            setSelectedCueId(cue.id);
                          }
                        }}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          selectedCue?.id === cue.id
                            ? 'bg-accent-500/20 border border-accent-500/30'
                            : canEdit
                            ? 'bg-dark-700/50 hover:bg-dark-700 cursor-pointer'
                            : 'bg-dark-700/30 opacity-60'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono text-dark-400">
                            {cue.index}
                          </span>
                          <span className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            tc && tc.text ? 'bg-accent-500' : 'bg-dark-500'
                          )} />
                        </div>
                        <p className="text-xs text-white/90 line-clamp-1">{cue.text}</p>
                        {tc && tc.text && (
                          <p className="text-xs text-accent-400/80 line-clamp-1 mt-1">{tc.text}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 border-t border-white/5 flex gap-2">
                  {segment.status === 'unclaimed' && (
                    <button
                      onClick={() => handleClaimSegment(segment.id)}
                      className="flex-1 py-1.5 bg-accent-600 hover:bg-accent-500 text-white rounded-lg text-sm transition-colors"
                    >
                      认领翻译
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => handleReleaseSegment(segment.id)}
                      className="flex-1 py-1.5 bg-warning-500/20 hover:bg-warning-500/30 text-warning-500 rounded-lg text-sm transition-colors"
                    >
                      释放区间
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => handleCompleteSegment(segment.id)}
                      className="flex-1 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition-colors"
                    >
                      完成
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
