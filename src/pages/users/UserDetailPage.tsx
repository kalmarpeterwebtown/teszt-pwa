import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { User, Competency } from '../../types';
import { ROLE_LABELS } from '../../types';
import { getUserById, getAllCompetencies } from '../../services/db';
import { useAuthStore } from '../../stores/authStore';
import { canEditTargetUser } from '../../services/permissions';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import {
  ArrowLeftIcon,
  PencilIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = useAuthStore((s) => s.currentUser);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const [userData, allCompetencies] = await Promise.all([
          getUserById(id),
          getAllCompetencies(),
        ]);
        if (userData) {
          setUser(userData);
          setCompetencies(allCompetencies);
        } else {
          toast.error('Felhasználó nem található');
          navigate('/users');
        }
      } catch (err) {
        console.error('Failed to load user:', err);
        toast.error('Hiba az adatok betöltésekor');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-500">Betöltés...</p>
      </div>
    );
  }

  if (!user) return null;

  const userCompetencies = competencies.filter((c) => user.competencyIds.includes(c.id));
  const canEdit = currentUser ? canEditTargetUser(currentUser.role, user.role) : false;

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'danger';
      case 'OsztalyVezeto':
        return 'warning';
      case 'CsoportVezeto':
        return 'info';
      case 'Munkatars':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/users')}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <Badge variant={getRoleBadgeVariant(user.role)} className="mt-1">
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => navigate(`/users/${user.id}/edit`)}>
            <PencilIcon className="h-5 w-5 mr-2" />
            Szerkesztés
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Alapadatok</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-3">
              <BriefcaseIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Munkakör</p>
                <p className="font-medium text-gray-900">{user.jobTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <a
                  href={`mailto:${user.contacts.email}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {user.contacts.email}
                </a>
              </div>
            </div>
            {user.contacts.phone && (
              <div className="flex items-center gap-3">
                <PhoneIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Telefon</p>
                  <a
                    href={`tel:${user.contacts.phone}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {user.contacts.phone}
                  </a>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Munkarend</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Munkaidő</p>
                <p className="font-medium text-gray-900">
                  {user.workSchedule.workdayStart} - {user.workSchedule.workdayEnd}
                </p>
              </div>
            </div>
            {user.workSchedule.vacations.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Szabadságok</p>
                <div className="space-y-2">
                  {user.workSchedule.vacations.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                    >
                      <span>
                        {v.from} - {v.to}
                      </span>
                      <Badge
                        variant={
                          v.type === 'vacation'
                            ? 'success'
                            : v.type === 'sick'
                            ? 'danger'
                            : 'default'
                        }
                      >
                        {v.type === 'vacation'
                          ? 'Szabadság'
                          : v.type === 'sick'
                          ? 'Betegség'
                          : 'Egyéb'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Link
              to={`/schedule?user=${user.id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              Munkarend részletek →
            </Link>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Kompetenciák</h2>
          </CardHeader>
          <CardBody>
            {userCompetencies.length === 0 ? (
              <p className="text-gray-500 text-sm">Nincsenek kompetenciák hozzárendelve</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userCompetencies.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {c.name}
                    {c.category && (
                      <span className="ml-1 text-blue-600 text-xs">({c.category})</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
