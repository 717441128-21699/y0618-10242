import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Clock, 
  User, 
  Edit3, 
  GripVertical,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { SubtitleCue, SubtitleSegment } from '../../types';
import { formatTime } from '../../utils/time';
import { STATUS_LABELS, STATUS_COLORS } from '../../types';
import { useUserStore } from '../../store/userStore';
import { useEditorStore } from '../../store/editorStore';
import { cn } from '../../lib/utils';

interface SubtitleListProps {
  cues: SubtitleCue[];
  segments: SubtitleSegment[];
  selectedCueId: string | null;
  onSelectCue: (id: string) => void;
  onUpdateCue: (id: string, updates: Partial<SubtitleCue>) => void;
  onClaimSegment: (segmentId: string) => void;
  onReleaseSegment: (segmentId: string) => void;
  currentUserId: string;
  mode: 'edit' | 'translate' | 'review';
}

export default function SubtitleList({
  cues,
  segments,
  selectedCueId,
  onSelectCue,
  onUpdateCue,
  onClaimSegment,
  onReleaseSegment,
  currentUserId,
  mode,
}: SubtitleListProps) {
  const { users } = useUserStore();
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set(segments.map(s => s.id)));

  const toggleSegment = (segmentId: string) => {
    const newExpanded = new Set(expandedSegments);
    if (newExpanded.has(segmentId)) {
      newExpanded.delete(segmentId);
    } else {
      newExpanded.add(segmentId);
    }
    setExpandedSegments(newExpanded);
  };

  const getCuesForSegment = (segment: SubtitleSegment) => {
    return cues.filter(c => c.index >= segment.startCueIndex + 1 && c.index <= segment.endCueIndex + 1);
  };

  const isSegmentClaimedByCurrentUser = (segment: SubtitleSegment) => {
    return segment.status === 'claimed' && segment.claimedBy === currentUserId;
  };

  const canEditCue = (cue: SubtitleCue) => {
    const segment = segments.find(s => s.id === cue.segmentId);
    if (!segment) return true;
    return isSegmentClaimedByCurrentUser(segment) || segment.status === 'completed';
  };

  const getSegmentProgress = (segment: SubtitleSegment) => {
    const segmentCues = getCuesForSegment(segment);
    if (segmentCues.length === 0) return 0;
    const completed = segmentCues.filter(c => c.status === 'approved' || c.status === 'edited' || c.status === 'translated').length;
    return Math.round((completed / segmentCues.length) * 100);
  };

  const handleTextChange = (cueId: string, newText: string, field: 'text' | 'translation') => {
    onUpdateCue(cueId, { [field]: newText, status: mode === 'translate' ? 'translating' : 'editing' });
  };

  const handleTextBlur = (cueId: string) => {
    onUpdateCue(cueId, { status: mode === 'translate' ? 'translated' : 'edited' });
  };

  const getClaimedByUser = (userId?: string) => {
    if (!userId) return null;
    return users.find(u => u.id === userId);
  };

  return (
    <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-400px)] scrollbar-thin pr-2">
      {segments.map((segment, segIndex) => {
        const segmentCues = getCuesForSegment(segment);
        const progress = getSegmentProgress(segment);
        const isExpanded = expandedSegments.has(segment.id);
        const claimedUser = getClaimedByUser(segment.claimedBy);
        const canClaim = segment.status === 'unclaimed';
        const canRelease = isSegmentClaimedByCurrentUser(segment);

        return (
          <motion.div
            key={segment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: segIndex * 0.03 }}
            className="glass-panel rounded-xl overflow-hidden"
          >
            <div
              className={cn(
                'flex items-center gap-3 p-3 cursor-pointer transition-colors',
                segment.status === 'completed'
                  ? 'bg-accent-500/10 border-b border-accent-500/20'
                  : canRelease
                  ? 'bg-primary-500/10 border-b border-primary-500/20'
                  : 'bg-dark-700/50 border-b border-white/5 hover:bg-white/5'
              )}
              onClick={() => toggleSegment(segment.id)}
            >
              <div className="p-1.5 rounded-lg bg-white/5">
                <GripVertical className="w-4 h-4 text-dark-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white text-sm">
                    区间 {segIndex + 1}: 第 {segment.startCueIndex + 1} - {segment.endCueIndex + 1} 行
                  </span>
                  <span className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full text-white',
                    segment.status === 'completed' ? 'bg-accent-500' :
                    segment.status === 'claimed' ? 'bg-primary-500' : 'bg-dark-600'
                  )}>
                    {segment.status === 'completed' ? '已完成' :
                     segment.status === 'claimed' ? '处理中' : '待认领'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-dark-400">
                  <span>共 {segmentCues.length} 行</span>
                  <span className="text-accent-400">{progress}%</span>
                  {claimedUser && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {claimedUser.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canClaim && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClaimSegment(segment.id);
                    }}
                    className="px-3 py-1.5 text-xs bg-accent-600 hover:bg-accent-500 text-white rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    认领
                  </button>
                )}
                {canRelease && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReleaseSegment(segment.id);
                    }}
                    className="px-3 py-1.5 text-xs bg-warning-500/20 hover:bg-warning-500/30 text-warning-500 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3" />
                    释放
                  </button>
                )}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-dark-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-dark-400" />
                )}
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="divide-y divide-white/5">
                    {segmentCues.map((cue, cueIndex) => {
                      const isSelected = cue.id === selectedCueId;
                      const canEdit = canEditCue(cue);

                      return (
                        <motion.div
                          key={cue.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: cueIndex * 0.02 }}
                          onClick={() => {
                            onSelectCue(cue.id);
                            const seekTo = useEditorStore.getState().seekTo;
                            seekTo?.(cue.startTime);
                          }}
                          className={cn(
                            'p-3 cursor-pointer transition-colors',
                            isSelected
                              ? 'bg-accent-500/15 border-l-2 border-accent-500'
                              : 'hover:bg-white/5 border-l-2 border-transparent'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center gap-1 pt-1">
                              <span className="text-xs font-display font-bold text-dark-400">
                                #{cue.index}
                              </span>
                              <span className={cn(
                                'w-2 h-2 rounded-full',
                                STATUS_COLORS[cue.status]
                              )} />
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-center gap-2 text-xs text-dark-400 font-mono">
                                <span>{formatTime(cue.startTime)}</span>
                                <span>→</span>
                                <span>{formatTime(cue.endTime)}</span>
                                <span className={cn(
                                  'ml-auto text-[10px] px-1.5 py-0.5 rounded text-white',
                                  STATUS_COLORS[cue.status]
                                )}>
                                  {STATUS_LABELS[cue.status]}
                                </span>
                              </div>
                              
                              {canEdit ? (
                                <input
                                  type="text"
                                  value={cue.text}
                                  onChange={(e) => handleTextChange(cue.id, e.target.value, 'text')}
                                  onBlur={() => handleTextBlur(cue.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full bg-dark-700/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent-500 transition-colors"
                                  placeholder="输入字幕内容..."
                                />
                              ) : (
                                <p className="text-sm text-white">{cue.text}</p>
                              )}
                              
                              {mode === 'translate' && (
                                canEdit ? (
                                  <input
                                    type="text"
                                    value={cue.translation || ''}
                                    onChange={(e) => handleTextChange(cue.id, e.target.value, 'translation')}
                                    onBlur={() => handleTextBlur(cue.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full bg-accent-500/10 border border-accent-500/30 rounded-lg px-3 py-1.5 text-sm text-accent-400 focus:outline-none focus:border-accent-500 transition-colors placeholder-dark-500"
                                    placeholder="输入译文..."
                                  />
                                ) : (
                                  <p className="text-sm text-accent-400">{cue.translation || '暂无译文'}</p>
                                )
                              )}
                            </div>
                            <Edit3 className={cn(
                              'w-4 h-4 mt-1 flex-shrink-0',
                              canEdit ? 'text-dark-400' : 'text-dark-600'
                            )} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
