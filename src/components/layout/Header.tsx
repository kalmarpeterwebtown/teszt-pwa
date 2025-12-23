import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { ROLE_LABELS } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Bars3Icon,
  ArrowRightStartOnRectangleIcon,
  WifiIcon,
  SignalSlashIcon,
} from '@heroicons/react/24/outline';

export function Header() {
  const { currentUser, logout } = useAuthStore();
  const { isOnline, toggleSidebar } = useAppStore();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
        >
          <Bars3Icon className="h-6 w-6 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Badge variant="success" className="flex items-center gap-1">
              <WifiIcon className="h-3 w-3" />
              Online
            </Badge>
          ) : (
            <Badge variant="warning" className="flex items-center gap-1">
              <SignalSlashIcon className="h-3 w-3" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      {currentUser && (
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
            <p className="text-xs text-gray-500">{ROLE_LABELS[currentUser.role]}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
          </Button>
        </div>
      )}
    </header>
  );
}
