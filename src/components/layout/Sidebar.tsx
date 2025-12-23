import { NavLink } from 'react-router-dom';
import {
  UsersIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  FolderIcon,
  ChartBarIcon,
  CpuChipIcon,
  ClockIcon,
  BellIcon,
  PresentationChartBarIcon,
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  TagIcon,
  ListBulletIcon,
  FlagIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';
import { canManageCompetencies, canManageMasterData } from '../../services/permissions';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}

function NavItem({ to, icon, label, disabled }: NavItemProps) {
  if (disabled) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 text-gray-400 cursor-not-allowed">
        <span className="w-5 h-5">{icon}</span>
        <span className="text-sm">{label}</span>
        <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
          Hamarosan
        </span>
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
          isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
        }`
      }
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const canManageComps = currentUser ? canManageCompetencies(currentUser.role) : false;
  const canManageMaster = currentUser ? canManageMasterData(currentUser.role) : false;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">TMS</h1>
        <p className="text-xs text-gray-500">Task Management System</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="mb-4">
          <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Felhasználók
          </p>
          <NavItem to="/users" icon={<UsersIcon />} label="Felhasználók" />
          {canManageComps && (
            <NavItem to="/competencies" icon={<AcademicCapIcon />} label="Kompetenciák" />
          )}
          <NavItem to="/schedule" icon={<CalendarDaysIcon />} label="Munkarend" />
        </div>

        <div className="mb-4">
          <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Projektek
          </p>
          <NavItem to="/projects" icon={<FolderIcon />} label="Projektek" />
          <NavItem to="/kpi" icon={<ChartBarIcon />} label="KPI-ok" disabled />
        </div>

        <div className="mb-4">
          <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Erőforrások
          </p>
          <NavItem to="/resources" icon={<CpuChipIcon />} label="Erőforrás tervezés" disabled />
          <NavItem to="/timesheet" icon={<ClockIcon />} label="Munkaidő könyvelés" disabled />
        </div>

        {canManageMaster && (
          <div className="mb-4">
            <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Admin
            </p>
            <NavItem to="/admin/project-tags" icon={<TagIcon />} label="Projekt címkék" />
            <NavItem to="/admin/task-types" icon={<ListBulletIcon />} label="Feladat típusok" />
            <NavItem to="/admin/priorities" icon={<FlagIcon />} label="Prioritások" />
            <NavItem to="/admin/statuses" icon={<CheckCircleIcon />} label="Státuszok" />
          </div>
        )}

        <div className="mb-4">
          <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Egyéb
          </p>
          <NavItem to="/notifications" icon={<BellIcon />} label="Értesítések" disabled />
          <NavItem to="/dashboards" icon={<PresentationChartBarIcon />} label="Dashboardok" disabled />
          <NavItem to="/reports" icon={<DocumentChartBarIcon />} label="Reportok" disabled />
          <NavItem to="/exports" icon={<ArrowDownTrayIcon />} label="Exportok" disabled />
        </div>
      </nav>

      <div className="p-3 border-t border-gray-200">
        <NavItem to="/settings" icon={<Cog6ToothIcon />} label="Beállítások" disabled />
      </div>
    </aside>
  );
}
