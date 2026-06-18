import { create } from 'zustand';
import type { Project, SubtitleCue, SubtitleSegment, SubtitleStatus } from '../types';

const STORAGE_KEY = 'subtitle_platform_projects';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  
  fetchProjects: () => void;
  fetchProject: (id: string) => void;
  createProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  updateCue: (projectId: string, lang: string, cueId: string, updates: Partial<SubtitleCue>) => void;
  claimSegment: (projectId: string, segmentId: string, userId: string) => void;
  releaseSegment: (projectId: string, segmentId: string) => void;
  completeSegment: (projectId: string, segmentId: string) => void;
  
  setCurrentProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  fetchProjects: () => {
    set({ loading: true });
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const projects = stored ? JSON.parse(stored) : [];
      set({ projects, loading: false });
    } catch (error) {
      set({ error: '加载项目列表失败', loading: false });
    }
  },

  fetchProject: (id: string) => {
    set({ loading: true });
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const projects: Project[] = stored ? JSON.parse(stored) : [];
      const project = projects.find(p => p.id === id) || null;
      set({ currentProject: project, loading: false });
    } catch (error) {
      set({ error: '加载项目失败', loading: false });
    }
  },

  createProject: (project: Project) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const projects: Project[] = stored ? JSON.parse(stored) : [];
    const updated = [...projects, project];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ projects: updated });
  },

  updateProject: (id: string, updates: Partial<Project>) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const projects: Project[] = stored ? JSON.parse(stored) : [];
    const updated = projects.map(p => p.id === id ? { ...p, ...updates } : p);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    set(state => ({
      projects: updated,
      currentProject: state.currentProject?.id === id 
        ? { ...state.currentProject, ...updates } 
        : state.currentProject,
    }));
  },

  deleteProject: (id: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const projects: Project[] = stored ? JSON.parse(stored) : [];
    const updated = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ projects: updated });
  },

  updateCue: (projectId: string, lang: string, cueId: string, updates: Partial<SubtitleCue>) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const projects: Project[] = stored ? JSON.parse(stored) : [];
    const updated = projects.map(p => {
      if (p.id !== projectId) return p;
      const cues = p.subtitles[lang] || [];
      const updatedCues = cues.map(c => c.id === cueId ? { ...c, ...updates } : c);
      return {
        ...p,
        subtitles: { ...p.subtitles, [lang]: updatedCues },
      };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    set(state => ({
      projects: updated,
      currentProject: state.currentProject?.id === projectId
        ? {
            ...state.currentProject,
            subtitles: {
              ...state.currentProject.subtitles,
              [lang]: (state.currentProject.subtitles[lang] || []).map(c =>
                c.id === cueId ? { ...c, ...updates } : c
              ),
            },
          }
        : state.currentProject,
    }));
  },

  claimSegment: (projectId: string, segmentId: string, userId: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const projects: Project[] = stored ? JSON.parse(stored) : [];
    const updated = projects.map(p => {
      if (p.id !== projectId) return p;
      const segments = p.segments.map(s => 
        s.id === segmentId && s.status === 'unclaimed'
          ? { ...s, status: 'claimed' as const, claimedBy: userId, deadline: Date.now() + 3600000 * 2 }
          : s
      );
      return { ...p, segments };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    set(state => ({
      projects: updated,
      currentProject: state.currentProject?.id === projectId
        ? {
            ...state.currentProject,
            segments: state.currentProject.segments.map(s =>
              s.id === segmentId && s.status === 'unclaimed'
                ? { ...s, status: 'claimed' as const, claimedBy: userId, deadline: Date.now() + 3600000 * 2 }
                : s
            ),
          }
        : state.currentProject,
    }));
  },

  releaseSegment: (projectId: string, segmentId: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const projects: Project[] = stored ? JSON.parse(stored) : [];
    const updated = projects.map(p => {
      if (p.id !== projectId) return p;
      const segments = p.segments.map(s =>
        s.id === segmentId
          ? { ...s, status: 'unclaimed' as const, claimedBy: undefined, deadline: undefined }
          : s
      );
      return { ...p, segments };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    set(state => ({
      projects: updated,
      currentProject: state.currentProject?.id === projectId
        ? {
            ...state.currentProject,
            segments: state.currentProject.segments.map(s =>
              s.id === segmentId
                ? { ...s, status: 'unclaimed' as const, claimedBy: undefined, deadline: undefined }
                : s
            ),
          }
        : state.currentProject,
    }));
  },

  completeSegment: (projectId: string, segmentId: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const projects: Project[] = stored ? JSON.parse(stored) : [];
    const updated = projects.map(p => {
      if (p.id !== projectId) return p;
      const segments = p.segments.map(s =>
        s.id === segmentId
          ? { ...s, status: 'completed' as const }
          : s
      );
      return { ...p, segments };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    set(state => ({
      projects: updated,
      currentProject: state.currentProject?.id === projectId
        ? {
            ...state.currentProject,
            segments: state.currentProject.segments.map(s =>
              s.id === segmentId
                ? { ...s, status: 'completed' as const }
                : s
            ),
          }
        : state.currentProject,
    }));
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
  },
}));
