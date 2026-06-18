import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { formatTimeShort } from '../../utils/time';
import type { SubtitleCue } from '../../types';
import { useEditorStore } from '../../store/editorStore';
import { cn } from '../../lib/utils';

interface TimelineTrackProps {
  cues: SubtitleCue[];
  duration: number;
  currentTime: number;
  selectedCueId: string | null;
  onSelectCue: (id: string) => void;
  onUpdateCueTime: (id: string, startTime: number, endTime: number) => void;
  zoomLevel: number;
}

export default function TimelineTrack({
  cues,
  duration,
  currentTime,
  selectedCueId,
  onSelectCue,
  onUpdateCueTime,
  zoomLevel,
}: TimelineTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragType, setDragType] = useState<'move' | 'start' | 'end' | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const pixelsPerMs = (zoomLevel * 800) / duration;

  const handleMouseDown = (e: React.MouseEvent, cueId: string, type: 'move' | 'start' | 'end') => {
    e.stopPropagation();
    setDragging(cueId);
    setDragType(type);
    
    const cue = cues.find(c => c.id === cueId);
    if (!cue) return;
    
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clickX = e.clientX - rect.left;
    const cueStartX = cue.startTime * pixelsPerMs;
    const cueEndX = cue.endTime * pixelsPerMs;
    
    if (type === 'move') {
      setDragOffset(clickX - cueStartX);
    } else if (type === 'start') {
      setDragOffset(clickX - cueStartX);
    } else {
      setDragOffset(clickX - cueEndX);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !dragType || !trackRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const newTime = Math.max(0, Math.min(duration, mouseX / pixelsPerMs));
    
    const cue = cues.find(c => c.id === dragging);
    if (!cue) return;
    
    let newStartTime = cue.startTime;
    let newEndTime = cue.endTime;
    
    if (dragType === 'move') {
      const delta = newTime - (cue.startTime + dragOffset / pixelsPerMs);
      newStartTime = Math.max(0, cue.startTime + delta);
      newEndTime = Math.min(duration, cue.endTime + delta);
    } else if (dragType === 'start') {
      newStartTime = Math.max(0, Math.min(cue.endTime - 100, newTime - dragOffset / pixelsPerMs));
    } else {
      newEndTime = Math.max(cue.startTime + 100, Math.min(duration, newTime - dragOffset / pixelsPerMs));
    }
    
    onUpdateCueTime(dragging, newStartTime, newEndTime);
  }, [dragging, dragType, dragOffset, cues, duration, pixelsPerMs, onUpdateCueTime]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setDragType(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const time = clickX / pixelsPerMs;
    const seekTo = useEditorStore.getState().seekTo;
    seekTo?.(time);
  };

  const timeMarkers = [];
  const interval = duration / 10;
  for (let i = 0; i <= 10; i++) {
    timeMarkers.push(i * interval);
  }

  return (
    <div className="bg-dark-900/80 rounded-xl p-4 border border-white/10">
      <div className="relative">
        <div className="flex justify-between text-xs text-dark-400 mb-2 px-1">
          {timeMarkers.map((time, i) => (
            <span key={i}>{formatTimeShort(time)}</span>
          ))}
        </div>
        
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          className="relative h-20 bg-dark-800/50 rounded-lg cursor-pointer overflow-hidden"
          style={{ width: `${800 * zoomLevel}px`, minWidth: '100%' }}
        >
          <div className="absolute inset-0 flex justify-between pointer-events-none">
            {timeMarkers.map((_, i) => (
              <div key={i} className="w-px h-full bg-white/5" />
            ))}
          </div>
          
          <motion.div
            className="absolute top-0 bottom-0 w-0.5 bg-accent-500 z-20 pointer-events-none"
            style={{ left: `${currentTime * pixelsPerMs}px` }}
          >
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-accent-500 rounded-full shadow-lg shadow-accent-500/50" />
          </motion.div>
          
          {cues.map((cue) => {
            const left = cue.startTime * pixelsPerMs;
            const width = (cue.endTime - cue.startTime) * pixelsPerMs;
            const isSelected = cue.id === selectedCueId;
            const isDragging = dragging === cue.id;
            
            return (
              <motion.div
                key={cue.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  scale: isDragging ? 1.02 : 1,
                  y: isDragging ? -2 : 0,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCue(cue.id);
                }}
                onMouseDown={(e) => handleMouseDown(e, cue.id, 'move')}
                className={cn(
                  'absolute top-3 bottom-3 rounded-lg cursor-move transition-colors overflow-hidden group',
                  isSelected
                    ? 'bg-accent-500/40 border-2 border-accent-400 shadow-lg shadow-accent-500/30'
                    : 'bg-primary-500/30 border border-primary-400/50 hover:bg-primary-500/40 hover:border-primary-400',
                  isDragging && 'opacity-80'
                )}
                style={{ left, width, minWidth: '30px' }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 z-10"
                  onMouseDown={(e) => handleMouseDown(e, cue.id, 'start')}
                />
                <div
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 z-10"
                  onMouseDown={(e) => handleMouseDown(e, cue.id, 'end')}
                />
                <div className="p-1.5 h-full overflow-hidden">
                  <p className="text-xs text-white truncate leading-tight">
                    {cue.text}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
