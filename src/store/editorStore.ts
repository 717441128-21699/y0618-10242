import { create } from 'zustand';

interface EditorState {
  isPlaying: boolean;
  currentTime: number;
  selectedCueId: string | null;
  zoomLevel: number;
  mode: 'edit' | 'translate' | 'review';
  targetLanguage: string;
  showCollaborators: boolean;

  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setSelectedCueId: (id: string | null) => void;
  setZoomLevel: (level: number) => void;
  setMode: (mode: 'edit' | 'translate' | 'review') => void;
  setTargetLanguage: (lang: string) => void;
  setShowCollaborators: (show: boolean) => void;
  seekTo: (time: number) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  isPlaying: false,
  currentTime: 0,
  selectedCueId: null,
  zoomLevel: 1,
  mode: 'edit',
  targetLanguage: 'zh-CN',
  showCollaborators: false,

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setSelectedCueId: (id) => set({ selectedCueId: id }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
  setMode: (mode) => set({ mode }),
  setTargetLanguage: (lang) => set({ targetLanguage: lang }),
  setShowCollaborators: (show) => set({ showCollaborators: show }),
  seekTo: (time) => set({ currentTime: time }),
}));
