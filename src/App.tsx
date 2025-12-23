import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { UserListPage } from './pages/users/UserListPage';
import { UserDetailPage } from './pages/users/UserDetailPage';
import { UserFormPage } from './pages/users/UserFormPage';
import { CompetencyListPage } from './pages/competencies/CompetencyListPage';
import { SchedulePage } from './pages/schedule/SchedulePage';
import { ProjectListPage } from './pages/projects/ProjectListPage';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage';
import { ProjectFormPage } from './pages/projects/ProjectFormPage';
import { TaskDetailPage } from './pages/tasks/TaskDetailPage';
import { TaskFormPage } from './pages/tasks/TaskFormPage';
import { ProjectTagsPage } from './pages/admin/ProjectTagsPage';
import { TaskTypesPage } from './pages/admin/TaskTypesPage';
import { PrioritiesPage } from './pages/admin/PrioritiesPage';
import { StatusesPage } from './pages/admin/StatusesPage';
import { PlaceholderPage } from './pages/placeholders/PlaceholderPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  useOnlineStatus();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/users" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/users" replace />} />
        {/* Users */}
        <Route path="users" element={<UserListPage />} />
        <Route path="users/new" element={<UserFormPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="users/:id/edit" element={<UserFormPage />} />
        <Route path="competencies" element={<CompetencyListPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        {/* Projects */}
        <Route path="projects" element={<ProjectListPage />} />
        <Route path="projects/new" element={<ProjectFormPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="projects/:id/edit" element={<ProjectFormPage />} />
        {/* Tasks */}
        <Route path="projects/:projectId/tasks/new" element={<TaskFormPage />} />
        <Route path="projects/:projectId/tasks/:taskId" element={<TaskDetailPage />} />
        <Route path="projects/:projectId/tasks/:taskId/edit" element={<TaskFormPage />} />
        {/* Admin */}
        <Route path="admin/project-tags" element={<ProjectTagsPage />} />
        <Route path="admin/task-types" element={<TaskTypesPage />} />
        <Route path="admin/priorities" element={<PrioritiesPage />} />
        <Route path="admin/statuses" element={<StatusesPage />} />
        {/* Placeholders */}
        <Route path="kpi" element={<PlaceholderPage />} />
        <Route path="resources" element={<PlaceholderPage />} />
        <Route path="timesheet" element={<PlaceholderPage />} />
        <Route path="notifications" element={<PlaceholderPage />} />
        <Route path="dashboards" element={<PlaceholderPage />} />
        <Route path="reports" element={<PlaceholderPage />} />
        <Route path="exports" element={<PlaceholderPage />} />
        <Route path="settings" element={<PlaceholderPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/teszt-pwa">
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
    </BrowserRouter>
  );
}
