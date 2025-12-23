import { useLocation } from 'react-router-dom';
import { Card, CardBody } from '../../components/ui/Card';
import { ClockIcon } from '@heroicons/react/24/outline';

const pageNames: Record<string, string> = {
  '/projects': 'Projektek',
  '/tasks': 'Feladatok',
  '/kpi': 'KPI-ok',
  '/resources': 'Erőforrás tervezés',
  '/timesheet': 'Munkaidő könyvelés',
  '/notifications': 'Értesítések',
  '/dashboards': 'Dashboardok',
  '/reports': 'Reportok',
  '/exports': 'Exportok',
  '/settings': 'Beállítások',
};

export function PlaceholderPage() {
  const location = useLocation();
  const pageName = pageNames[location.pathname] || 'Oldal';

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardBody className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ClockIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{pageName}</h1>
          <p className="text-gray-500 mb-4">Ez a modul fejlesztés alatt áll.</p>
          <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
            Coming Soon
          </span>
        </CardBody>
      </Card>
    </div>
  );
}
