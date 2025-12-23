import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { User, Competency, Role } from '../../types';
import { ROLE_LABELS } from '../../types';
import { getUserById, createUser, updateUser, getAllCompetencies } from '../../services/db';
import { useAuthStore } from '../../stores/authStore';
import { getCreatableRoles, canEditTargetUser } from '../../services/permissions';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { CompetencySelect } from '../../components/ui/CompetencySelect';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface FormData {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  role: Role;
  competencyIds: string[];
  workdayStart: string;
  workdayEnd: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  jobTitle?: string;
  role?: string;
}

export function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [existingUser, setExistingUser] = useState<User | null>(null);
  const currentUser = useAuthStore((s) => s.currentUser);

  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    jobTitle: '',
    role: 'Munkatars',
    competencyIds: [],
    workdayStart: '09:00',
    workdayEnd: '17:30',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    async function loadData() {
      try {
        const allCompetencies = await getAllCompetencies();
        setCompetencies(allCompetencies);

        if (id) {
          const user = await getUserById(id);
          if (user) {
            setExistingUser(user);
            setForm({
              name: user.name,
              email: user.contacts.email,
              phone: user.contacts.phone || '',
              jobTitle: user.jobTitle,
              role: user.role,
              competencyIds: user.competencyIds,
              workdayStart: user.workSchedule.workdayStart,
              workdayEnd: user.workSchedule.workdayEnd,
            });
          } else {
            toast.error('Felhasználó nem található');
            navigate('/users');
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        toast.error('Hiba az adatok betöltésekor');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, navigate]);

  const creatableRoles = currentUser ? getCreatableRoles(currentUser.role) : [];
  const canEditRole = isEdit && existingUser && currentUser
    ? canEditTargetUser(currentUser.role, existingUser.role)
    : true;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'A név megadása kötelező';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Az email megadása kötelező';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Érvénytelen email cím';
    }

    if (!form.jobTitle.trim()) {
      newErrors.jobTitle = 'A munkakör megadása kötelező';
    }

    if (!isEdit && !creatableRoles.includes(form.role)) {
      newErrors.role = 'Nincs jogosultsága ilyen szerepkörű felhasználó létrehozására';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    try {
      const userData: User = {
        id: existingUser?.id || uuidv4(),
        name: form.name.trim(),
        contacts: {
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
        },
        jobTitle: form.jobTitle.trim(),
        role: form.role,
        competencyIds: form.competencyIds,
        workSchedule: {
          workdayStart: form.workdayStart,
          workdayEnd: form.workdayEnd,
          vacations: existingUser?.workSchedule.vacations || [],
        },
        createdAt: existingUser?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isEdit) {
        await updateUser(userData);
        toast.success('Felhasználó frissítve');
      } else {
        await createUser(userData);
        toast.success('Felhasználó létrehozva');
      }

      navigate('/users');
    } catch (err) {
      console.error('Failed to save user:', err);
      toast.error('Hiba a mentéskor');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-500">Betöltés...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/users')}>
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Felhasználó szerkesztése' : 'Új felhasználó'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Alapadatok</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              id="name"
              label="Név *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
              placeholder="Teljes név"
            />

            <Input
              id="email"
              type="email"
              label="Email *"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              placeholder="pelda@email.com"
            />

            <Input
              id="phone"
              type="tel"
              label="Telefon"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+36 30 123 4567"
            />

            <Input
              id="jobTitle"
              label="Munkakör *"
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              error={errors.jobTitle}
              placeholder="pl. Senior Fejlesztő"
            />

            <Select
              id="role"
              label="Szerepkör *"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              options={creatableRoles.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
              error={errors.role}
              disabled={!canEditRole}
            />
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Kompetenciák</h2>
          </CardHeader>
          <CardBody>
            <div className="relative">
              <CompetencySelect
                competencies={competencies}
                selectedIds={form.competencyIds}
                onChange={(ids) => setForm({ ...form, competencyIds: ids })}
              />
            </div>
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Munkarend</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="workdayStart"
                type="time"
                label="Munkaidő kezdete"
                value={form.workdayStart}
                onChange={(e) => setForm({ ...form, workdayStart: e.target.value })}
              />
              <Input
                id="workdayEnd"
                type="time"
                label="Munkaidő vége"
                value={form.workdayEnd}
                onChange={(e) => setForm({ ...form, workdayEnd: e.target.value })}
              />
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={() => navigate('/users')}>
            Mégse
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Mentés...' : isEdit ? 'Mentés' : 'Létrehozás'}
          </Button>
        </div>
      </form>
    </div>
  );
}
