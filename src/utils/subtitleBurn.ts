import type { SubtitleCue, BurnOptions } from '../types';

interface BurnCallbacks {
  onProgress?: (progress: number) => void;
  onStatus?: (status: string) => void;
}

export async function burnSubtitlesToVideo(
  videoUrl: string,
  cues: SubtitleCue[],
  options: BurnOptions,
  callbacks: BurnCallbacks = {}
): Promise<Blob> {
  const { onProgress, onStatus } = callbacks;

  const resolutionMap: Record<string, { width: number; height: number }> = {
    '720p': { width: 1280, height: 720 },
    '1080p': { width: 1920, height: 1080 },
    '4k': { width: 3840, height: 2160 },
  };

  const res = resolutionMap[options.resolution] || resolutionMap['1080p'];

  const canvas = document.createElement('canvas');
  canvas.width = res.width;
  canvas.height = res.height;
  const ctx = canvas.getContext('2d')!;

  const video = document.createElement('video');
  video.src = videoUrl;
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;

  onStatus?.('正在加载视频...');
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('视频加载失败'));
  });

  const duration = video.duration;
  const fps = 30;

  const canvasStream = canvas.captureStream(fps);

  let audioStream: MediaStream | null = null;
  try {
    const v = video as any;
    if (v.captureStream) {
      const fullStream = v.captureStream();
      const audioTracks = fullStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioStream = new MediaStream(audioTracks);
      }
    }
  } catch (e) {
    // Audio capture not supported
  }

  const combinedStream = new MediaStream();
  canvasStream.getVideoTracks().forEach(t => combinedStream.addTrack(t));
  if (audioStream) {
    audioStream.getAudioTracks().forEach(t => combinedStream.addTrack(t));
  }

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
    ? 'video/webm;codecs=vp8'
    : 'video/webm';

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 5000000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const getActiveCue = (currentTime: number): SubtitleCue | null => {
    return cues.find(c => currentTime >= c.startTime / 1000 && currentTime <= c.endTime / 1000) || null;
  };

  const drawSubtitle = (cue: SubtitleCue) => {
    const text = cue.text;
    if (!text) return;

    const fontSize = options.fontSize * (res.height / 1080);
    const padding = fontSize * 0.4;
    const maxWidth = canvas.width * 0.8;

    ctx.font = `bold ${fontSize}px ${options.fontFamily}, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const lines = wrapText(ctx, text, maxWidth);
    const lineHeight = fontSize * 1.4;
    const totalHeight = lines.length * lineHeight + padding * 2;
    const blockWidth = Math.min(maxWidth, Math.max(...lines.map(l => ctx.measureText(l).width)) + padding * 2);

    let y: number;
    if (options.position === 'top') {
      y = totalHeight / 2 + fontSize;
    } else if (options.position === 'middle') {
      y = canvas.height / 2;
    } else {
      y = canvas.height - totalHeight / 2 - fontSize;
    }

    const x = canvas.width / 2;
    const blockY = y - (lines.length * lineHeight) / 2;

    ctx.fillStyle = options.backgroundColor;
    ctx.globalAlpha = 0.75;
    roundRect(ctx, x - blockWidth / 2, blockY - padding, blockWidth, totalHeight, 8);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = options.fontColor;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;

    lines.forEach((line, i) => {
      const lineY = blockY + padding + i * lineHeight + lineHeight / 2;
      ctx.fillText(line, x, lineY);
    });

    ctx.shadowBlur = 0;
  };

  const drawFrame = () => {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (vw && vh) {
      const scale = Math.min(canvas.width / vw, canvas.height / vh);
      const drawW = vw * scale;
      const drawH = vh * scale;
      const dx = (canvas.width - drawW) / 2;
      const dy = (canvas.height - drawH) / 2;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, dx, dy, drawW, drawH);
    }

    const activeCue = getActiveCue(video.currentTime);
    if (activeCue) {
      drawSubtitle(activeCue);
    }

    const progress = Math.min(100, (video.currentTime / duration) * 100);
    onProgress?.(Math.floor(progress));
  };

  return new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(blob);
    };

    recorder.onerror = () => reject(new Error('录制失败'));

    let rafId: number;

    const renderLoop = () => {
      if (video.ended || video.currentTime >= duration) {
        cancelAnimationFrame(rafId);
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
        return;
      }
      drawFrame();
      rafId = requestAnimationFrame(renderLoop);
    };

    video.onplay = () => {
      onStatus?.('正在烧录字幕...');
      rafId = requestAnimationFrame(renderLoop);
    };

    video.onended = () => {
      cancelAnimationFrame(rafId);
      drawFrame();
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    };

    recorder.start(100);
    video.play().catch(() => reject(new Error('视频播放失败，可能是跨域限制')));
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  paragraphs.forEach(para => {
    const words = para.split('');
    let currentLine = '';

    for (const char of words) {
      const testLine = currentLine + char;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
  });

  return lines.slice(0, 4);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
