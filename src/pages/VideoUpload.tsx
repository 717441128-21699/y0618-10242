import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  FileVideo, 
  CheckCircle2, 
  AlertCircle,
  Settings,
  Sparkles,
  Loader2,
  Languages,
  Plus,
  Trash2
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../store/notificationStore';
import { useProjectStore } from '../store/projectStore';
import { generateNewProject } from '../mock/data';
import { LANGUAGE_NAMES } from '../types';

export default function VideoUpload() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();
  const { createProject, currentProject, updateProject } = useProjectStore();
  
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguages, setTargetLanguages] = useState<string[]>(['zh-CN']);
  const [accuracy, setAccuracy] = useState('standard');
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      addNotification('error', '不支持的文件格式，请上传 MP4、MOV 或 AVI 格式');
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      addNotification('error', '文件大小不能超过 500MB');
      return;
    }

    setFile(file);
    setProjectName(file.name.replace(/\.[^/.]+$/, ''));
    
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.onloadedmetadata = () => {
      setDuration(tempVideo.duration * 1000);
    };
    tempVideo.src = url;
  };

  const removeFile = () => {
    setFile(null);
    setVideoUrl('');
    setDuration(0);
    setProjectName('');
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const simulateUpload = async () => {
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 80));
      setUploadProgress(i);
    }
  };

  const simulateRecognition = async () => {
    const steps = [
      '正在分析音频轨道...',
      '提取语音特征...',
      'AI 语音识别中...',
      '生成时间轴对齐...',
      '创建字幕条目...',
      '处理完成！'
    ];

    for (let i = 0; i < steps.length; i++) {
      setProcessStep(i + 1);
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      addNotification('error', '请先上传视频文件');
      return;
    }
    if (!projectName.trim()) {
      addNotification('error', '请输入项目名称');
      return;
    }

    setIsProcessing(true);
    
    try {
      await simulateUpload();
      await simulateRecognition();
      
      const finalVideoUrl = videoUrl;
      
      if (id && currentProject) {
        updateProject(id, {
          videoUrl: finalVideoUrl,
          videoDuration: duration,
          sourceLanguage,
          targetLanguages,
          status: 'editing',
        });
        addNotification('success', '视频识别完成，已生成初始字幕');
      } else {
        const newProject = generateNewProject(
          projectName,
          projectDesc,
          finalVideoUrl,
          duration,
          sourceLanguage,
          targetLanguages
        );
        newProject.status = 'editing';
        createProject(newProject);
        addNotification('success', '项目创建成功，已生成初始字幕');
        navigate(`/project/${newProject.id}/editor`);
        return;
      }
      
      navigate(`/project/${id}/editor`);
    } catch (error) {
      addNotification('error', '处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const addTargetLanguage = () => {
    const available = Object.keys(LANGUAGE_NAMES).filter(
      l => l !== sourceLanguage && !targetLanguages.includes(l)
    );
    if (available.length > 0) {
      setTargetLanguages([...targetLanguages, available[0]]);
    }
  };

  const removeTargetLanguage = (lang: string) => {
    setTargetLanguages(targetLanguages.filter(l => l !== lang));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white mb-1">
          {id ? '视频上传' : '创建新项目'}
        </h1>
        <p className="text-dark-400 text-sm">
          上传视频文件，系统将自动进行 AI 语音识别生成初始字幕
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
              dragActive
                ? 'border-accent-500 bg-accent-500/10'
                : 'border-white/20 hover:border-white/30 bg-dark-700/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <AnimatePresence mode="wait">
              {!file ? (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-8"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-accent-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    拖拽视频文件到此处
                  </h3>
                  <p className="text-dark-400 text-sm mb-4">
                    或点击下方按钮选择文件，支持 MP4、MOV、AVI 格式，最大 500MB
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => inputRef.current?.click()}
                    className="px-6 py-2.5 bg-accent-600 hover:bg-accent-500 text-white rounded-lg font-medium transition-colors"
                  >
                    选择视频文件
                  </motion.button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative"
                >
                  <button
                    onClick={removeFile}
                    className="absolute top-0 right-0 z-10 p-2 bg-dark-800/90 rounded-lg hover:bg-dark-700 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                  
                  <div className="aspect-video bg-dark-900 rounded-xl overflow-hidden">
                    {videoUrl && (
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-full object-contain"
                        controls
                        muted
                      />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-4 p-4 bg-dark-800/50 rounded-xl">
                    <div className="p-2.5 rounded-lg bg-accent-500/20">
                      <FileVideo className="w-6 h-6 text-accent-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{file.name}</p>
                      <p className="text-xs text-dark-400">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                        {duration > 0 && ` · ${Math.floor(duration / 60000)}分${Math.floor((duration % 60000) / 1000)}秒`}
                      </p>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-accent-500" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-accent-500/20">
                  <Sparkles className="w-6 h-6 text-accent-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI 语音识别进行中</h3>
                  <p className="text-sm text-dark-400">请勿关闭页面</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-dark-300">上传进度</span>
                    <span className="text-accent-400 font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-accent-500 to-primary-500 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {['正在分析音频轨道...', '提取语音特征...', 'AI 语音识别中...', '生成时间轴对齐...', '创建字幕条目...', '处理完成！'].map((step, i) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{
                        opacity: i < processStep ? 1 : 0.4,
                        x: 0,
                      }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                        i < processStep ? 'bg-accent-500/10' : 'bg-white/5'
                      }`}
                    >
                      {i < processStep ? (
                        i === processStep - 1 ? (
                          <Loader2 className="w-4 h-4 text-accent-400 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-accent-500" />
                        )
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-dark-500" />
                      )}
                      <span className={`text-sm ${i < processStep ? 'text-white' : 'text-dark-400'}`}>
                        {step}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-5">
            <h3 className="font-semibold text-white mb-4">项目信息</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">项目名称</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-accent-500 transition-colors"
                  placeholder="输入项目名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">项目描述</label>
                <textarea
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-accent-500 transition-colors resize-none"
                  placeholder="简要描述视频内容"
                />
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-accent-400" />
              <h3 className="font-semibold text-white">识别配置</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">源语言</label>
                <select
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-500 transition-colors"
                >
                  {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-dark-300">目标语言</label>
                  <button
                    onClick={addTargetLanguage}
                    className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    添加
                  </button>
                </div>
                <div className="space-y-2">
                  {targetLanguages.map((lang) => (
                    <div key={lang} className="flex items-center gap-2 p-2 bg-dark-700 rounded-lg">
                      <Languages className="w-4 h-4 text-dark-400" />
                      <span className="text-sm text-white flex-1">{LANGUAGE_NAMES[lang]}</span>
                      <button
                        onClick={() => removeTargetLanguage(lang)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-dark-400 hover:text-warning-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">识别精度</label>
                <select
                  value={accuracy}
                  onChange={(e) => setAccuracy(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-500 transition-colors"
                >
                  <option value="fast">快速模式</option>
                  <option value="standard">标准模式</option>
                  <option value="high">高精度模式</option>
                </select>
                <p className="text-xs text-dark-500 mt-1.5">高精度模式识别更准确，但耗时更长</p>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={isProcessing || !file}
            className="w-full py-3 bg-gradient-to-r from-accent-600 to-primary-600 hover:from-accent-500 hover:to-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 glow-accent"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                开始 AI 识别
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
