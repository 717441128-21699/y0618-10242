import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationToast from './NotificationToast';
import { useUserStore } from '../../store/userStore';
import { useProjectStore } from '../../store/projectStore';
import { initializeMockData } from '../../mock/data';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { id } = useParams<{ id: string }>();
  const { fetchCurrentUser, fetchUsers } = useUserStore();
  const { fetchProjects, fetchProject } = useProjectStore();

  useEffect(() => {
    initializeMockData();
    fetchCurrentUser();
    fetchUsers();
    fetchProjects();
  }, [fetchCurrentUser, fetchUsers, fetchProjects]);

  useEffect(() => {
    if (id) {
      fetchProject(id);
    }
  }, [id, fetchProject]);

  return (
    <div className="min-h-screen bg-dark-800 subtle-pattern">
      <Sidebar projectId={id} />
      <main className="ml-64 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
      <NotificationToast />
    </div>
  );
}
