import { useEffect, useMemo, useState } from 'react';

import { useNotifications } from '@/entities/notification';
import { projectApi } from '@/entities/project';
import type { Project } from '@/entities/project';
import { useSession } from '@/entities/session';
import type { TranslationKey } from '@/shared/lib/i18n';

interface UrgentTask {
  id: string;
  title: string;
  projectCode: string;
  timeLeft: string;
  isWarning: boolean;
}

interface ProjectProgress {
  id: string;
  code: string;
  name: string;
  progress: number;
  wip: number;
  shared: number;
  pub: number;
  members: string[];
}

interface Activity {
  id: string;
  type: 'approve' | 'upload' | 'comment' | 'sign';
  content: string;
  time: string;
}

interface DashboardStats {
  projects: number;
  pendingApprovals: number;
  completedTasks: number;
  urgentTasks: UrgentTask[];
  projectProgress: ProjectProgress[];
  activities: Activity[];
}

function getGreetingKey(): TranslationKey {
  const hour = new Date().getHours();
  if (hour < 12) return 'dashboard.greeting.morning';
  if (hour < 18) return 'dashboard.greeting.afternoon';
  return 'dashboard.greeting.evening';
}

function formatTodayVi(): string {
  return new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function projectCode(name: string, index: number): string {
  const slug = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 4);
  return slug || `PRJ-${index + 1}`;
}

function mapProjectsToProgress(projects: Project[]): ProjectProgress[] {
  return projects.slice(0, 3).map((p, i) => ({
    id: p.id,
    code: projectCode(p.projectName, i),
    name: p.projectName,
    progress: [45, 72, 28][i % 3],
    wip: [12, 8, 5][i % 3],
    shared: [6, 4, 3][i % 3],
    pub: [2, 1, 1][i % 3],
    members: ['A', 'B', '+'],
  }));
}

const MOCK_URGENT_TASKS: UrgentTask[] = [
  {
    id: '1',
    title: 'Phê duyệt bản vẽ MEP Tầng 5',
    projectCode: 'MEP-05',
    timeLeft: 'Còn 2 giờ',
    isWarning: false,
  },
  {
    id: '2',
    title: 'Cập nhật hồ sơ thiết kế kiến trúc',
    projectCode: 'ARC-02',
    timeLeft: 'Còn 1 ngày',
    isWarning: true,
  },
];

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1',
    type: 'approve',
    content: 'Bạn đã phê duyệt Hồ sơ thiết kế MEP Tầng 3',
    time: '10 phút trước',
  },
  {
    id: '2',
    type: 'upload',
    content: 'Nguyễn Văn A đã tải lên MEP_Level5.rvt',
    time: '1 giờ trước',
  },
  {
    id: '3',
    type: 'comment',
    content: 'Bình luận mới trên Issue #42',
    time: '3 giờ trước',
  },
];

export function useDashboard() {
  const { currentUser } = useSession();
  const { unreadCount } = useNotifications();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await projectApi.getAll();
        if (!cancelled) {
          setProjects(data.result ?? []);
        }
      } catch {
        if (!cancelled) setProjects([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats: DashboardStats = useMemo(
    () => ({
      projects: projects.length,
      pendingApprovals: MOCK_URGENT_TASKS.length,
      completedTasks: 12,
      urgentTasks: MOCK_URGENT_TASKS,
      projectProgress: mapProjectsToProgress(projects),
      activities: MOCK_ACTIVITIES,
    }),
    [projects],
  );

  return {
    currentUser,
    unreadCount,
    loading,
    stats,
    greetingKey: getGreetingKey(),
    todayStr: formatTodayVi(),
  };
}
