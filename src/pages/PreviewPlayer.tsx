import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Languages,
  Settings,
  Loader2,
  AlertCircle,
  SkipBack,
  SkipForward,
  Subtitles,
  Check,
  ChevronDown
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useNotificationStore } from '../store/notificationStore';
import StatusBadge from '../components/ui/StatusBadge';
import { LANGUAGE_NAMES, type SubtitleCue } from '../types';
import { formatTime } from '../utils/time';
import { cn } from '../lib/utils';

export default function PreviewPlayer() {
  const { id } = useParams<{ id: string }>();
  const { currentProject, loading, fetchProject } = useProjectStore();
  const { addNotification } = useNotificationStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('off');
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [subtitleInitialized, setSubtitleInitialized] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProject(id);
    }
  }, [id]);

  useEffect(() => {
    if (currentProject && !subtitleInitialized) {
      setSelectedSubtitle(currentProject.sourceLanguage);
      setSubtitleInitialized(true);
    }
  }, [currentProject, subtitleInitialized]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime * 1000);
    const handleLoadedMetadata = () => setDuration(video.duration * 1000);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [currentProject]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          skip(-5);
          break;
        case 'ArrowRight':
          skip(5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = e.currentTarget;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
  };

  const adjustVolume = (delta: number) => {
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSettingsMenu(false);
  };

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
  const allLanguages = [currentProject.sourceLanguage, ...currentProject.targetLanguages];

  const getCurrentCue = (): SubtitleCue | null => {
    if (selectedSubtitle === 'off') return null;

    const cues = currentProject.subtitles[selectedSubtitle] || sourceCues;

    const cue = cues.find(
      c => currentTime >= c.startTime && currentTime <= c.endTime
    );

    return cue || null;
  };

  const currentCue = getCurrentCue();
  const displayText = currentCue ? currentCue.text : '';

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getLanguageCueCount = (lang: string): number => {
    if (lang === currentProject.sourceLanguage) {
      return sourceCues.filter(c => c.text && c.text.trim()).length;
    }
    const cues = currentProject.subtitles[lang] || [];
    return cues.filter(c => c.text && c.text.trim()).length;
  };

  const subtitleOptions = [
    { value: 'off', label: '关闭字幕' },
    ...allLanguages.map(lang => ({
      value: lang,
      label: LANGUAGE_NAMES[lang],
    })),
  ];

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

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
                视频预览
              </h1>
              <StatusBadge status={currentProject.status} />
            </div>
            <p className="text-dark-400 text-sm">{currentProject.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-dark-700 rounded-lg">
            <Subtitles className="w-4 h-4 text-accent-400" />
            <span className="text-sm text-dark-300">{allLanguages.length} 个语言轨道</span>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative bg-black rounded-xl overflow-hidden group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => !showSubtitleMenu && !showSettingsMenu && setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={currentProject.videoUrl}
          className="w-full aspect-video"
          onClick={togglePlay}
        />

        <AnimatePresence>
          {displayText && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 left-0 right-0 text-center px-8 pointer-events-none"
            >
              <span className="inline-block px-6 py-3 bg-black/80 text-white text-xl rounded-lg max-w-4xl">
                {displayText}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center bg-black/30"
              onClick={togglePlay}
            >
              <div className="w-20 h-20 rounded-full bg-accent-600/90 flex items-center justify-center cursor-pointer hover:bg-accent-500 transition-colors">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4"
            >
              <div
                className="h-1.5 bg-white/30 rounded-full cursor-pointer mb-4 group/progress"
                onClick={seek}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
              >
                <div
                  className="h-full bg-accent-500 rounded-full relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-accent-500 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white" />
                    )}
                  </button>

                  <button
                    onClick={() => skip(-10)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <SkipBack className="w-5 h-5 text-white" />
                  </button>

                  <button
                    onClick={() => skip(10)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <SkipForward className="w-5 h-5 text-white" />
                  </button>

                  <div className="flex items-center gap-2 group/volume">
                    <button
                      onClick={toggleMute}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 text-white" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setVolume(v);
                        setIsMuted(v === 0);
                        if (videoRef.current) {
                          videoRef.current.volume = v;
                          videoRef.current.muted = v === 0;
                        }
                      }}
                      className="w-0 group-hover/volume:w-20 transition-all duration-300 accent-accent-500"
                    />
                  </div>

                  <span className="text-sm text-white/80 font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowSubtitleMenu(!showSubtitleMenu);
                        setShowSettingsMenu(false);
                      }}
                      className={cn(
                        'p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1',
                        showSubtitleMenu && 'bg-white/10'
                      )}
                    >
                      <Languages className="w-5 h-5 text-white" />
                      <ChevronDown className="w-3 h-3 text-white" />
                    </button>

                    <AnimatePresence>
                      {showSubtitleMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full right-0 mb-2 bg-dark-800 rounded-lg overflow-hidden min-w-48 border border-white/10 shadow-xl"
                        >
                          <div className="p-2">
                            {subtitleOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setSelectedSubtitle(option.value);
                                  setShowSubtitleMenu(false);
                                  addNotification('info', `已切换到${option.label}`);
                                }}
                                className={cn(
                                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors',
                                  selectedSubtitle === option.value
                                    ? 'bg-accent-500/20 text-accent-400'
                                    : 'text-white hover:bg-white/10'
                                )}
                              >
                                <span className="text-sm">{option.label}</span>
                                {selectedSubtitle === option.value && (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowSettingsMenu(!showSettingsMenu);
                        setShowSubtitleMenu(false);
                      }}
                      className={cn(
                        'p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1',
                        showSettingsMenu && 'bg-white/10'
                      )}
                    >
                      <Settings className="w-5 h-5 text-white" />
                      <span className="text-xs text-white">{playbackRate}x</span>
                    </button>

                    <AnimatePresence>
                      {showSettingsMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full right-0 mb-2 bg-dark-800 rounded-lg overflow-hidden min-w-32 border border-white/10 shadow-xl"
                        >
                          <div className="p-2">
                            <p className="text-xs text-dark-400 px-3 py-1">播放速度</p>
                            {playbackRates.map((rate) => (
                              <button
                                key={rate}
                                onClick={() => changePlaybackRate(rate)}
                                className={cn(
                                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors',
                                  playbackRate === rate
                                    ? 'bg-accent-500/20 text-accent-400'
                                    : 'text-white hover:bg-white/10'
                                )}
                              >
                                <span className="text-sm">{rate}x</span>
                                {playbackRate === rate && (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    onClick={toggleFullscreen}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Maximize className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 glass-panel rounded-xl p-4">
          <h3 className="font-semibold text-white mb-4">可用字幕轨道</h3>
          <div className="grid grid-cols-2 gap-3">
            {allLanguages.map((lang, index) => (
              <motion.div
                key={lang}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  setSelectedSubtitle(lang);
                  addNotification('info', `已切换到${LANGUAGE_NAMES[lang]}`);
                }}
                className={cn(
                  'p-4 rounded-xl border-2 cursor-pointer transition-all',
                  selectedSubtitle === lang
                    ? 'border-accent-500 bg-accent-500/10'
                    : 'border-white/10 bg-dark-700/50 hover:border-white/20'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{LANGUAGE_NAMES[lang]}</span>
                  {lang === currentProject.sourceLanguage && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400">
                      原文
                    </span>
                  )}
                  {selectedSubtitle === lang && (
                    <Check className="w-4 h-4 text-accent-400" />
                  )}
                </div>
                <p className="text-xs text-dark-400">
                  {getLanguageCueCount(lang)} 条字幕
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-4">
            <h3 className="font-semibold text-white mb-3">视频信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-dark-400">项目名称</span>
                <span className="text-white">{currentProject.name}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-dark-400">视频时长</span>
                <span className="text-white">{formatTime(currentProject.videoDuration)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-dark-400">源语言</span>
                <span className="text-white">{LANGUAGE_NAMES[currentProject.sourceLanguage]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-dark-400">目标语言</span>
                <span className="text-white text-right">
                  {currentProject.targetLanguages.map(lang => LANGUAGE_NAMES[lang]).join('、')}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4">
            <h3 className="font-semibold text-white mb-3">快捷键</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-dark-400">播放/暂停</span>
                <kbd className="px-2 py-1 bg-dark-700 rounded text-white">Space</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-400">快退 5 秒</span>
                <kbd className="px-2 py-1 bg-dark-700 rounded text-white">←</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-400">快进 5 秒</span>
                <kbd className="px-2 py-1 bg-dark-700 rounded text-white">→</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-400">音量增加</span>
                <kbd className="px-2 py-1 bg-dark-700 rounded text-white">↑</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-400">音量减少</span>
                <kbd className="px-2 py-1 bg-dark-700 rounded text-white">↓</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-400">全屏</span>
                <kbd className="px-2 py-1 bg-dark-700 rounded text-white">F</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-400">静音</span>
                <kbd className="px-2 py-1 bg-dark-700 rounded text-white">M</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
