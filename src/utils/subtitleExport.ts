import type { SubtitleCue, ExportOptions } from '../types';
import { formatTime, formatTimeVTT } from './time';

export function exportToSRT(cues: SubtitleCue[], useTranslation = false): string {
  return cues
    .map((cue, index) => {
      const text = useTranslation ? (cue.translation || cue.text) : cue.text;
      return `${index + 1}\n${formatTime(cue.startTime)} --> ${formatTime(cue.endTime)}\n${text}\n`;
    })
    .join('\n');
}

export function exportToVTT(cues: SubtitleCue[], useTranslation = false): string {
  const header = 'WEBVTT\n\n';
  const body = cues
    .map((cue) => {
      const text = useTranslation ? (cue.translation || cue.text) : cue.text;
      return `${formatTimeVTT(cue.startTime)} --> ${formatTimeVTT(cue.endTime)}\n${text}\n`;
    })
    .join('\n');
  return header + body;
}

export function exportToASS(cues: SubtitleCue[], useTranslation = false): string {
  const header = `[Script Info]
Title: Subtitles
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0
WrapStyle: 2
ScaledBorderAndShadow: yes
Video Zoom Percent: 1

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const body = cues
    .map((cue) => {
      const text = useTranslation ? (cue.translation || cue.text) : cue.text;
      const start = formatASSTime(cue.startTime);
      const end = formatASSTime(cue.endTime);
      return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
    })
    .join('\n');

  return header + body;
}

function formatASSTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportSubtitles(cues: SubtitleCue[], options: ExportOptions): void {
  let content: string;
  let filename: string;
  let mimeType: string;
  const useTranslation = options.language !== 'en';

  switch (options.format) {
    case 'srt':
      content = exportToSRT(cues, useTranslation);
      filename = `subtitles_${options.language}.srt`;
      mimeType = 'text/plain';
      break;
    case 'vtt':
      content = exportToVTT(cues, useTranslation);
      filename = `subtitles_${options.language}.vtt`;
      mimeType = 'text/vtt';
      break;
    case 'ass':
      content = exportToASS(cues, useTranslation);
      filename = `subtitles_${options.language}.ass`;
      mimeType = 'text/plain';
      break;
    default:
      content = exportToSRT(cues, useTranslation);
      filename = `subtitles_${options.language}.srt`;
      mimeType = 'text/plain';
  }

  downloadFile(content, filename, mimeType);
}
