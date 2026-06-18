import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MessageSquare,
  Star,
  Save,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useUserStore } from '../store/userStore';
import { useNotificationStore } from '../store/notificationStore';
import { useEditorStore } from '../store/editorStore';
import StatusBadge from '../components/ui/StatusBadge';
import { LANGUAGE_NAMES, STATUS_LABELS, STATUS_COLORS, type ReviewInfo } from '../types';
import { formatTime } from '../utils/time';
import VideoPlayer from '../components/video/VideoPlayer';
import { cn } from '../lib/utils';

export default function ReviewWorkbench() {
  const { id } = useParams<{ id: string }>();
  const { currentProject, loading, updateCue } = useProjectStore();
  const { currentUser, users } = useUserStore();
  const { addNotification } = useNotificationStore();
  const { currentTime, setSelectedCueId, selectedCueId } = useEditorStore();

  const [targetLanguage, setTargetLanguage] = useState('zh-CN');
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
  const [accuracyScores, setAccuracyScores] = useState<Record<string, number>>({});
  const [fluencyScores, setFluencyScores] = useState<Record<string, number>>({});
  const [formatScores, setFormatScores] = useState<Record<string, number>>({});

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
  const targetCues = currentProject.subtitles[targetLanguage] || sourceCues;
  const reviewableCues = sourceCues.filter(c => c.status === 'translated' || c.status === 'edited' || c.status === 'reviewing');

  const selectedCue = sourceCues.find(c => c.id === selectedCueId) || reviewableCues[0];

  const navigateCue = (direction: 'prev' | 'next') => {
    const currentIndex = reviewableCues.findIndex(c => c.id === selectedCueId);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedCueId(reviewableCues[currentIndex - 1].id);
    } else if (direction === 'next' && currentIndex < reviewableCues.length - 1) {
      setSelectedCueId(reviewableCues[currentIndex + 1].id);
    }
  };

  const handleApprove = (cueId: string) => {
    if (!currentUser) return;

    const accuracy = accuracyScores[cueId] || 5;
    const fluency = fluencyScores[cueId] || 5;
    const format = formatScores[cueId] || 5;

    const review: ReviewInfo = {
      reviewerId: currentUser.id,
      accuracyScore: accuracy,
      fluencyScore: fluency,
      formatScore: format,
      comments: reviewComments[cueId] || '',
      reviewedAt: Date.now(),
    };

    updateCue(currentProject.id, currentProject.sourceLanguage, cueId, {
      status: 'approved',
      review,
    });

    addNotification('success', '已通过该字幕');
    navigateCue('next');
  };

  const handleReject = (cueId: string) => {
    if (!currentUser) return;

    const comment = reviewComments[cueId];
    if (!comment || comment.trim() === '') {
      addNotification('warning', '请填写驳回原因');
      return;
    }

    const accuracy = accuracyScores[cueId] || 3;
    const fluency = fluencyScores[cueId] || 3;
    const format = formatScores[cueId] || 3;

    const review: ReviewInfo = {
      reviewerId: currentUser.id,
      accuracyScore: accuracy,
      fluencyScore: fluency,
      formatScore: format,
      comments: comment,
      reviewedAt: Date.now(),
    };

    updateCue(currentProject.id, currentProject.sourceLanguage, cueId, {
      status: 'rejected',
      review,
    });

    addNotification('warning', '已驳回该字幕，请填写修改意见');
    navigateCue('next');
  };

  const handleSaveReview = (cueId: string) => {
    if (!currentUser) return;

    const accuracy = accuracyScores[cueId] || 5;
    const fluency = fluencyScores[cueId] || 5;
    const format = formatScores[cueId] || 5;

    const review: ReviewInfo = {
      reviewerId: currentUser.id,
      accuracyScore: accuracy,
      fluencyScore: fluency,
      formatScore: format,
      comments: reviewComments[cueId] || '',
      reviewedAt: Date.now(),
    };

    updateCue(currentProject.id, currentProject.sourceLanguage, cueId, {
      status: 'reviewing',
      review,
    });

    addNotification('success', '审校意见已保存');
  };

  const renderStarRating = (value: number, onChange: (val: number) => void, label: string) => (
    <div className="flex items-center gap-2">
      <span className="text-xs text-dark-400 w-16">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                'w-4 h-4 transition-colors',
                star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-dark-600'
              )}
            />
          </button>
        ))}
        <span className="text-xs text-dark-400 ml-2 w-6">{value}</span>
      </div>
    </div>
  );

  const getCurrentIndex = () => reviewableCues.findIndex(c => c.id === selectedCueId);

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
                审校工作台
              </h1>
              <StatusBadge status={currentProject.status} />
            </div>
            <p className="text-dark-400 text-sm">{currentProject.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-dark-700 rounded-lg">
            <Eye className="w-4 h-4 text-dark-400" />
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

          <div className="flex items-center gap-2 px-3 py-2 bg-dark-700 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm text-dark-300">
              {sourceCues.filter(c => c.status === 'approved').length} / {reviewableCues.length} 已审校
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-primary-400" />
                <h3 className="font-semibold text-white">原文</h3>
              </div>

              {selectedCue && (
                <motion.div
                  key={selectedCue.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/30"
                >
                  <div className="flex items-center justify-between mb-3">
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
            </div>

            <div className="glass-panel rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-accent-400" />
                <h3 className="font-semibold text-white">译文</h3>
              </div>

              {selectedCue && (
                <motion.div
                  key={`trans-${selectedCue.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-xl bg-accent-500/10 border border-accent-500/30"
                >
                  <p className="text-lg text-accent-400 leading-relaxed">
                    {selectedCue.translation || '暂无译文'}
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                质量评分
              </h3>
              {selectedCue?.review && (
                <span className="text-xs text-dark-400">
                  已有评分: {(
                    (selectedCue.review.accuracyScore +
                      selectedCue.review.fluencyScore +
                      selectedCue.review.formatScore) / 3
                  ).toFixed(1)}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {selectedCue && renderStarRating(
                accuracyScores[selectedCue.id] || selectedCue.review?.accuracyScore || 5,
                (val) => setAccuracyScores({ ...accuracyScores, [selectedCue.id]: val }),
                '准确度'
              )}
              {selectedCue && renderStarRating(
                fluencyScores[selectedCue.id] || selectedCue.review?.fluencyScore || 5,
                (val) => setFluencyScores({ ...fluencyScores, [selectedCue.id]: val }),
                '流畅度'
              )}
              {selectedCue && renderStarRating(
                formatScores[selectedCue.id] || selectedCue.review?.formatScore || 5,
                (val) => setFormatScores({ ...formatScores, [selectedCue.id]: val }),
                '格式规范'
              )}
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-warning-400" />
              <h3 className="font-semibold text-white">审校意见</h3>
            </div>
            {selectedCue && (
              <textarea
                value={reviewComments[selectedCue.id] || selectedCue.review?.comments || ''}
                onChange={(e) => setReviewComments({ ...reviewComments, [selectedCue.id]: e.target.value })}
                rows={3}
                className="w-full p-3 rounded-lg bg-dark-700/50 border border-white/10 text-white placeholder-dark-500 focus:outline-none focus:border-warning-500 transition-colors resize-none"
                placeholder="请输入修改意见或备注（驳回时必填）..."
              />
            )}

            {selectedCue?.review?.comments && !reviewComments[selectedCue.id] && (
              <div className="mt-3 p-3 rounded-lg bg-dark-700/30">
                <p className="text-xs text-dark-400 mb-1">上次审校意见:</p>
                <p className="text-sm text-dark-300">{selectedCue.review.comments}</p>
              </div>
            )}
          </div>

          <VideoPlayer
            videoUrl={currentProject.videoUrl}
            onTimeUpdate={(time) => {
              const activeCue = reviewableCues.find(
                c => time >= c.startTime && time <= c.endTime
              );
              if (activeCue && activeCue.id !== selectedCueId) {
                setSelectedCueId(activeCue.id);
              }
            }}
          />

          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateCue('prev')}
              disabled={getCurrentIndex() <= 0}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-dark-700 text-dark-300 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              上一条
            </button>

            <div className="flex items-center gap-3">
              {selectedCue && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSaveReview(selectedCue.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded-lg font-medium transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    保存意见
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleReject(selectedCue.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-warning-600 hover:bg-warning-500 text-white rounded-lg font-medium transition-colors"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    驳回
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleApprove(selectedCue.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    通过
                  </motion.button>
                </>
              )}
            </div>

            <button
              onClick={() => navigateCue('next')}
              disabled={getCurrentIndex() >= reviewableCues.length - 1}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-dark-700 text-dark-300 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              下一条
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin pr-2">
          <div className="glass-panel rounded-xl p-3">
            <h4 className="text-sm font-semibold text-white mb-2">待审校列表</h4>
            <div className="space-y-2">
              {reviewableCues.map((cue, index) => (
                <motion.div
                  key={cue.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => {
                    setSelectedCueId(cue.id);
                    const seekTo = useEditorStore.getState().seekTo;
                    seekTo?.(cue.startTime);
                  }}
                  className={cn(
                    'p-3 rounded-lg cursor-pointer transition-all',
                    selectedCueId === cue.id
                      ? 'bg-accent-500/20 border border-accent-500/30'
                      : 'bg-dark-700/50 hover:bg-dark-700'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-dark-400">
                      {cue.index + 1} | {formatTime(cue.startTime)}
                    </span>
                    <span className={cn(
                      'w-2 h-2 rounded-full',
                      cue.status === 'approved' ? 'bg-green-500' :
                      cue.status === 'rejected' ? 'bg-warning-500' :
                      cue.status === 'reviewing' ? 'bg-yellow-500' : 'bg-dark-500'
                    )} />
                  </div>
                  <p className="text-xs text-white/90 line-clamp-1 mb-1">{cue.text}</p>
                  <p className="text-xs text-accent-400/80 line-clamp-1">{cue.translation}</p>
                  {cue.review && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-[10px] text-yellow-400">
                        {((cue.review.accuracyScore + cue.review.fluencyScore + cue.review.formatScore) / 3).toFixed(1)}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-xl p-3">
            <h4 className="text-sm font-semibold text-white mb-3">统计概览</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-400">待审校</span>
                <span className="text-sm text-white font-medium">
                  {reviewableCues.filter(c => c.status !== 'approved' && c.status !== 'rejected').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-400">已通过</span>
                <span className="text-sm text-green-400 font-medium">
                  {sourceCues.filter(c => c.status === 'approved').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-400">已驳回</span>
                <span className="text-sm text-warning-400 font-medium">
                  {sourceCues.filter(c => c.status === 'rejected').length}
                </span>
              </div>
              <div className="h-px bg-white/5 my-2" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-400">平均评分</span>
                <span className="text-sm text-yellow-400 font-medium">
                  {sourceCues.filter(c => c.review).length > 0
                    ? (sourceCues.filter(c => c.review).reduce((sum, c) =>
                      sum + (c.review!.accuracyScore + c.review!.fluencyScore + c.review!.formatScore) / 3, 0
                    ) / sourceCues.filter(c => c.review).length).toFixed(1)
                    : '-'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
