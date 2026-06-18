import { STATUS_LABELS, STATUS_COLORS } from '../../types';
import type { SubtitleStatus, ProjectStatus } from '../../types';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: SubtitleStatus | ProjectStatus;
  size?: 'sm' | 'md';
}

const projectStatusLabels: Record<ProjectStatus, string> = {
  uploading: '上传中',
  processing: '处理中',
  editing: '校对中',
  translating: '翻译中',
  reviewing: '审核中',
  completed: '已完成',
};

const projectStatusColors: Record<ProjectStatus, string> = {
  uploading: 'bg-blue-500',
  processing: 'bg-purple-500',
  editing: 'bg-primary-500',
  translating: 'bg-accent-500',
  reviewing: 'bg-yellow-500',
  completed: 'bg-green-500',
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const isSubtitleStatus = status in STATUS_LABELS;
  const label = isSubtitleStatus 
    ? STATUS_LABELS[status as SubtitleStatus] 
    : projectStatusLabels[status as ProjectStatus];
  const color = isSubtitleStatus 
    ? STATUS_COLORS[status as SubtitleStatus] 
    : projectStatusColors[status as ProjectStatus];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white',
        color,
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse-slow" />
      {label}
    </span>
  );
}
