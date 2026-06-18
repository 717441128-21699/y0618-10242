import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  FileText,
  Film,
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle,
  Palette,
  Type,
  Monitor,
  Zap
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useUserStore } from '../store/userStore';
import { useNotificationStore } from '../store/notificationStore';
import StatusBadge from '../components/ui/StatusBadge';
import { LANGUAGE_NAMES, type ExportOptions, type BurnOptions } from '../types';
import { exportToSRT, exportToVTT, exportToASS, downloadFile } from '../utils/subtitleExport';
import { burnSubtitlesToVideo, downloadBlob } from '../utils/subtitleBurn';
import { formatTime } from '../utils/time';
import VideoPlayer from '../components/video/VideoPlayer';
import { cn } from '../lib/utils';

export default function ExportCenter() {
  const { id } = useParams<{ id: string }>();
  const { currentProject, loading } = useProjectStore();
  const { currentUser } = useUserStore();
  const { addNotification } = useNotificationStore();

  const [exportFormat, setExportFormat] = useState<'srt' | 'vtt' | 'ass'>('srt');
  const [selectedLanguage, setSelectedLanguage] = useState('zh-CN');
  const [encoding, setEncoding] = useState<'utf-8' | 'gbk'>('utf-8');
  const [includeStyles, setIncludeStyles] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [burning, setBurning] = useState(false);
  const [burnProgress, setBurnProgress] = useState(0);
  const [burnStatus, setBurnStatus] = useState('');
  const [burnResult, setBurnResult] = useState<{ url: string; filename: string } | null>(null);

  const [burnOptions, setBurnOptions] = useState<BurnOptions>({
    language: 'zh-CN',
    fontFamily: 'Arial',
    fontSize: 20,
    fontColor: '#FFFFFF',
    backgroundColor: '#000000',
    position: 'bottom',
    resolution: '1080p',
  });

  const [activeTab, setActiveTab] = useState<'subtitle' | 'burn'>('subtitle');

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

  const getCuesForLanguage = (lang: string) => {
    if (lang === currentProject.sourceLanguage) {
      return sourceCues.filter(c => c.text && c.text.trim().length > 0);
    }
    const cues = currentProject.subtitles[lang] || [];
    return cues.filter(c => c.text && c.text.trim().length > 0);
  };

  const approvedCues = getCuesForLanguage(selectedLanguage);

  const handleExportSubtitles = () => {
    const options: ExportOptions = {
      format: exportFormat,
      language: selectedLanguage,
      encoding,
      includeStyles,
    };

    setExporting(true);

    setTimeout(() => {
      try {
        const cuesForExport = getCuesForLanguage(selectedLanguage);
        let content: string;
        let filename: string;
        let mimeType: string;

        switch (exportFormat) {
          case 'srt':
            content = exportToSRT(cuesForExport, false);
            filename = `${currentProject.name}_${LANGUAGE_NAMES[selectedLanguage]}.srt`;
            mimeType = 'text/plain';
            break;
          case 'vtt':
            content = exportToVTT(cuesForExport, false);
            filename = `${currentProject.name}_${LANGUAGE_NAMES[selectedLanguage]}.vtt`;
            mimeType = 'text/vtt';
            break;
          case 'ass':
            content = exportToASS(cuesForExport, false);
            filename = `${currentProject.name}_${LANGUAGE_NAMES[selectedLanguage]}.ass`;
            mimeType = 'text/plain';
            break;
        }

        downloadFile(content, filename, mimeType);
        addNotification('success', `字幕文件已导出: ${filename}`);
      } catch (error) {
        addNotification('error', '导出失败，请重试');
      } finally {
        setExporting(false);
      }
    }, 800);
  };

  const handleExportAllLanguages = () => {
    setExporting(true);

    setTimeout(() => {
      const languages = [currentProject.sourceLanguage, ...currentProject.targetLanguages];

      languages.forEach((lang, index) => {
        setTimeout(() => {
          const cuesForExport = getCuesForLanguage(lang);
          if (cuesForExport.length === 0) return;
          const content = exportToSRT(cuesForExport, false);
          const filename = `${currentProject.name}_${LANGUAGE_NAMES[lang]}.srt`;
          downloadFile(content, filename, 'text/plain');
        }, index * 300);
      });

      addNotification('success', `已导出 ${languages.length} 个语言版本的字幕`);
      setExporting(false);
    }, 500);
  };

  const handleBurnSubtitles = async () => {
    setBurning(true);
    setBurnProgress(0);
    setBurnResult(null);

    try {
      const cuesForBurn = getCuesForLanguage(burnOptions.language);

      if (cuesForBurn.length === 0) {
        addNotification('warning', `${LANGUAGE_NAMES[burnOptions.language]} 暂无字幕内容，请先完成该语言的翻译`);
        setBurning(false);
        return;
      }

      const blob = await burnSubtitlesToVideo(
        currentProject.videoUrl,
        cuesForBurn,
        burnOptions,
        {
          onProgress: (progress) => setBurnProgress(progress),
          onStatus: (status) => setBurnStatus(status),
        }
      );

      const filename = `${currentProject.name}_${LANGUAGE_NAMES[burnOptions.language]}_烧录.webm`;
      downloadBlob(blob, filename);
      setBurnResult({ url: URL.createObjectURL(blob), filename });
      addNotification('success', '字幕烧录完成，带字幕视频已开始下载');
    } catch (error) {
      console.error(error);
      addNotification('error', '字幕烧录失败，可能是视频跨域限制，请尝试使用本地上传的视频');
      setBurnProgress(0);
    } finally {
      setBurning(false);
      setBurnStatus('');
    }
  };

  const formatOptions = [
    { value: 'srt', label: 'SRT', desc: '最通用的字幕格式', icon: FileText },
    { value: 'vtt', label: 'VTT', desc: 'WebVTT 网页字幕格式', icon: FileText },
    { value: 'ass', label: 'ASS', desc: '高级样式字幕格式', icon: Palette },
  ];

  const positionOptions = [
    { value: 'bottom', label: '底部' },
    { value: 'top', label: '顶部' },
    { value: 'middle', label: '居中' },
  ];

  const resolutionOptions = [
    { value: '720p', label: '720p HD' },
    { value: '1080p', label: '1080p Full HD' },
    { value: '4k', label: '4K Ultra HD' },
  ];

  const allLanguages = [currentProject.sourceLanguage, ...currentProject.targetLanguages];

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
                导出中心
              </h1>
              <StatusBadge status={currentProject.status} />
            </div>
            <p className="text-dark-400 text-sm">{currentProject.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div className="glass-panel rounded-xl p-4">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('subtitle')}
                className={cn(
                  'flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                  activeTab === 'subtitle'
                    ? 'bg-accent-600 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                )}
              >
                <FileText className="w-4 h-4" />
                导出字幕文件
              </button>
              <button
                onClick={() => setActiveTab('burn')}
                className={cn(
                  'flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                  activeTab === 'burn'
                    ? 'bg-accent-600 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                )}
              >
                <Film className="w-4 h-4" />
                烧录字幕到视频
              </button>
            </div>

            {activeTab === 'subtitle' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-accent-400" />
                    选择导出格式
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {formatOptions.map((format) => {
                      const Icon = format.icon;
                      return (
                        <motion.button
                          key={format.value}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setExportFormat(format.value as any)}
                          className={cn(
                            'p-4 rounded-xl border-2 transition-all text-left',
                            exportFormat === format.value
                              ? 'border-accent-500 bg-accent-500/10'
                              : 'border-white/10 bg-dark-700/50 hover:border-white/20'
                          )}
                        >
                          <Icon className={cn(
                            'w-6 h-6 mb-2',
                            exportFormat === format.value ? 'text-accent-400' : 'text-dark-400'
                          )} />
                          <p className={cn(
                            'font-semibold',
                            exportFormat === format.value ? 'text-white' : 'text-dark-300'
                          )}>
                            {format.label}
                          </p>
                          <p className="text-xs text-dark-400">{format.desc}</p>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">选择语言</h3>
                    <div className="space-y-2">
                      {allLanguages.map((lang) => (
                        <label
                          key={lang}
                          className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 cursor-pointer transition-colors"
                        >
                          <input
                            type="radio"
                            name="language"
                            value={lang}
                            checked={selectedLanguage === lang}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="w-4 h-4 text-accent-500"
                          />
                          <span className="text-sm text-white">{LANGUAGE_NAMES[lang]}</span>
                          <span className="ml-auto text-xs text-dark-400">
                            {approvedCues.filter(c => lang === currentProject.sourceLanguage || c.translation).length} 条字幕
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">编码与选项</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-dark-400 mb-1 block">文件编码</label>
                        <select
                          value={encoding}
                          onChange={(e) => setEncoding(e.target.value as any)}
                          className="w-full p-3 rounded-lg bg-dark-700 border border-white/10 text-white focus:outline-none focus:border-accent-500"
                        >
                          <option value="utf-8">UTF-8 (推荐)</option>
                          <option value="gbk">GBK (简体中文)</option>
                        </select>
                      </div>
                      <label className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeStyles}
                          onChange={(e) => setIncludeStyles(e.target.checked)}
                          className="w-4 h-4 text-accent-500"
                        />
                        <span className="text-sm text-white">包含样式信息 (仅ASS格式)</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExportSubtitles}
                    disabled={exporting}
                    className="flex-1 py-3 px-6 bg-accent-600 hover:bg-accent-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {exporting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    导出 {exportFormat.toUpperCase()} 文件
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExportAllLanguages}
                    disabled={exporting}
                    className="py-3 px-6 bg-dark-600 hover:bg-dark-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Zap className="w-5 h-5" />
                    导出全部语言
                  </motion.button>
                </div>
              </motion.div>
            )}

            {activeTab === 'burn' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Type className="w-4 h-4 text-primary-400" />
                      字体设置
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-dark-400 mb-1 block">字体系列</label>
                        <select
                          value={burnOptions.fontFamily}
                          onChange={(e) => setBurnOptions({ ...burnOptions, fontFamily: e.target.value })}
                          className="w-full p-3 rounded-lg bg-dark-700 border border-white/10 text-white focus:outline-none focus:border-accent-500"
                        >
                          <option value="Arial">Arial</option>
                          <option value="Microsoft YaHei">微软雅黑</option>
                          <option value="SimHei">黑体</option>
                          <option value="Noto Sans SC">Noto Sans SC</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-dark-400 mb-1 block">
                          字体大小: {burnOptions.fontSize}px
                        </label>
                        <input
                          type="range"
                          min="12"
                          max="48"
                          value={burnOptions.fontSize}
                          onChange={(e) => setBurnOptions({ ...burnOptions, fontSize: parseInt(e.target.value) })}
                          className="w-full accent-accent-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-dark-400 mb-1 block">字体颜色</label>
                          <input
                            type="color"
                            value={burnOptions.fontColor}
                            onChange={(e) => setBurnOptions({ ...burnOptions, fontColor: e.target.value })}
                            className="w-full h-10 rounded-lg cursor-pointer bg-transparent"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-dark-400 mb-1 block">背景颜色</label>
                          <input
                            type="color"
                            value={burnOptions.backgroundColor}
                            onChange={(e) => setBurnOptions({ ...burnOptions, backgroundColor: e.target.value })}
                            className="w-full h-10 rounded-lg cursor-pointer bg-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-accent-400" />
                      位置与分辨率
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-dark-400 mb-1 block">字幕语言</label>
                        <select
                          value={burnOptions.language}
                          onChange={(e) => setBurnOptions({ ...burnOptions, language: e.target.value })}
                          className="w-full p-3 rounded-lg bg-dark-700 border border-white/10 text-white focus:outline-none focus:border-accent-500"
                        >
                          {allLanguages.map((lang) => (
                            <option key={lang} value={lang}>
                              {LANGUAGE_NAMES[lang]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-dark-400 mb-2 block">字幕位置</label>
                        <div className="flex gap-2">
                          {positionOptions.map((pos) => (
                            <button
                              key={pos.value}
                              onClick={() => setBurnOptions({ ...burnOptions, position: pos.value as any })}
                              className={cn(
                                'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                                burnOptions.position === pos.value
                                  ? 'bg-accent-600 text-white'
                                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                              )}
                            >
                              {pos.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-dark-400 mb-2 block">输出分辨率</label>
                        <div className="flex gap-2">
                          {resolutionOptions.map((res) => (
                            <button
                              key={res.value}
                              onClick={() => setBurnOptions({ ...burnOptions, resolution: res.value as any })}
                              className={cn(
                                'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                                burnOptions.resolution === res.value
                                  ? 'bg-accent-600 text-white'
                                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                              )}
                            >
                              {res.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {burning && (
                  <div className="p-4 rounded-xl bg-accent-500/10 border border-accent-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-accent-400">
                        {burnStatus || '正在烧录字幕...'}
                      </span>
                      <span className="text-sm text-accent-400">{burnProgress}%</span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-accent-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${burnProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-dark-400 mt-2">
                      正在逐帧渲染视频并叠加 {LANGUAGE_NAMES[burnOptions.language]} 字幕，位置：{burnOptions.position === 'top' ? '顶部' : burnOptions.position === 'middle' ? '居中' : '底部'}，请勿关闭页面
                    </p>
                  </div>
                )}

                {burnResult && !burning && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-sm text-green-400">字幕烧录完成！带字幕视频已开始下载</span>
                    </div>
                    <div className="rounded-lg overflow-hidden bg-black">
                      <video
                        src={burnResult.url}
                        controls
                        className="w-full max-h-64"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = burnResult.url;
                        link.download = burnResult.filename;
                        link.click();
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      重新下载 {burnResult.filename}
                    </button>
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBurnSubtitles}
                  disabled={burning}
                  className="w-full py-3 px-6 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {burning ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Film className="w-5 h-5" />
                  )}
                  开始烧录字幕并导出视频
                </motion.button>
              </motion.div>
            )}
          </div>

          <div className="glass-panel rounded-xl p-4">
            <h3 className="font-semibold text-white mb-3">预览</h3>
            <VideoPlayer videoUrl={currentProject.videoUrl} />
          </div>
        </div>

        <div className="space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin pr-2">
          <div className="glass-panel rounded-xl p-3">
            <h4 className="text-sm font-semibold text-white mb-3">导出信息</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-400">项目名称</span>
                <span className="text-sm text-white">{currentProject.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-400">字幕条数</span>
                <span className="text-sm text-white">{approvedCues.length} / {sourceCues.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-400">视频时长</span>
                <span className="text-sm text-white">{formatTime(currentProject.videoDuration)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-400">可用语言</span>
                <span className="text-sm text-white">{allLanguages.length} 种</span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-3">
            <h4 className="text-sm font-semibold text-white mb-3">字幕预览 ({LANGUAGE_NAMES[selectedLanguage]})</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
              {approvedCues.slice(0, 10).map((cue, index) => (
                <motion.div
                  key={cue.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="p-2 rounded-lg bg-dark-700/50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-dark-400">
                      {formatTime(cue.startTime)}
                    </span>
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  </div>
                  <p className="text-xs text-white/90 line-clamp-1">{cue.text}</p>
                </motion.div>
              ))}
              {approvedCues.length === 0 && (
                <p className="text-xs text-center text-dark-400 py-4">
                  该语言暂无可导出的字幕
                </p>
              )}
              {approvedCues.length > 10 && (
                <p className="text-xs text-center text-dark-400 py-2">
                  还有 {approvedCues.length - 10} 条字幕...
                </p>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-xl p-3">
            <h4 className="text-sm font-semibold text-white mb-3">格式说明</h4>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-accent-400 font-medium mb-1">SRT</p>
                <p className="text-dark-400">最通用的字幕格式，兼容性最好，支持大多数播放器和视频平台。</p>
              </div>
              <div>
                <p className="text-accent-400 font-medium mb-1">VTT</p>
                <p className="text-dark-400">WebVTT 格式，专为 HTML5 视频设计，支持样式和定位。</p>
              </div>
              <div>
                <p className="text-accent-400 font-medium mb-1">ASS</p>
                <p className="text-dark-400">高级字幕格式，支持丰富的样式、动画和特效，适合专业制作。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
