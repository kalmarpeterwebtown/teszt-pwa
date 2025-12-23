import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { User, Vacation } from '../../types';
import { getAllUsers, getUserById, updateUser } from '../../services/db';
import { useAuthStore } from '../../stores/authStore';
import { canEditTargetUser } from '../../services/permissions';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { PlusIcon, PencilIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface VacationForm {
  from: string;
  to: string;
  type: 'vacation' | 'sick' | 'other';
  note: string;
}

export function SchedulePage() {
  const [searchParams] = useSearchParams();
  const preselectedUserId = searchParams.get('user');

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [_loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [workdayStart, setWorkdayStart] = useState('09:00');
  const [workdayEnd, setWorkdayEnd] = useState('17:30');

  const [vacationModal, setVacationModal] = useState(false);
  const [editingVacation, setEditingVacation] = useState<Vacation | null>(null);
  const [vacationForm, setVacationForm] = useState<VacationForm>({
    from: '',
    to: '',
    type: 'vacation',
    note: '',
  });

  const currentUser = useAuthStore((s) => s.currentUser);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (preselectedUserId && users.length > 0) {
      setSelectedUserId(preselectedUserId);
    }
  }, [preselectedUserId, users]);

  useEffect(() => {
    if (selectedUserId) {
      loadSelectedUser();
    } else {
      setSelectedUser(null);
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
      const all = await getAllUsers();
      setUsers(all.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Hiba a felhasználók betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedUser = async () => {
    try {
      const user = await getUserById(selectedUserId);
      if (user) {
        setSelectedUser(user);
        setWorkdayStart(user.workSchedule.workdayStart);
        setWorkdayEnd(user.workSchedule.workdayEnd);
      }
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };

  const canEdit = selectedUser && currentUser
    ? canEditTargetUser(currentUser.role, selectedUser.role)
    : false;

  const handleSaveWorkday = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await updateUser({
        ...selectedUser,
        workSchedule: {
          ...selectedUser.workSchedule,
          workdayStart,
          workdayEnd,
        },
      });
      toast.success('Munkaidő mentve');
      loadSelectedUser();
    } catch (err) {
      console.error('Failed to save workday:', err);
      toast.error('Hiba a mentéskor');
    } finally {
      setSaving(false);
    }
  };

  const openVacationModal = (vacation?: Vacation) => {
    if (vacation) {
      setEditingVacation(vacation);
      setVacationForm({
        from: vacation.from,
        to: vacation.to,
        type: vacation.type,
        note: vacation.note || '',
      });
    } else {
      setEditingVacation(null);
      setVacationForm({ from: '', to: '', type: 'vacation', note: '' });
    }
    setVacationModal(true);
  };

  const handleSaveVacation = async () => {
    if (!selectedUser) return;
    if (!vacationForm.from || !vacationForm.to) {
      toast.error('A dátumok megadása kötelező');
      return;
    }
    if (vacationForm.from > vacationForm.to) {
      toast.error('A kezdő dátum nem lehet később, mint a záró dátum');
      return;
    }

    setSaving(true);
    try {
      let vacations = [...selectedUser.workSchedule.vacations];

      if (editingVacation) {
        vacations = vacations.map((v) =>
          v.id === editingVacation.id
            ? { ...v, ...vacationForm, note: vacationForm.note || undefined }
            : v
        );
      } else {
        vacations.push({
          id: uuidv4(),
          from: vacationForm.from,
          to: vacationForm.to,
          type: vacationForm.type,
          note: vacationForm.note || undefined,
        });
      }

      await updateUser({
        ...selectedUser,
        workSchedule: {
          ...selectedUser.workSchedule,
          vacations,
        },
      });

      toast.success(editingVacation ? 'Szabadság frissítve' : 'Szabadság hozzáadva');
      setVacationModal(false);
      loadSelectedUser();
    } catch (err) {
      console.error('Failed to save vacation:', err);
      toast.error('Hiba a mentéskor');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVacation = async (vacationId: string) => {
    if (!selectedUser) return;
    try {
      await updateUser({
        ...selectedUser,
        workSchedule: {
          ...selectedUser.workSchedule,
          vacations: selectedUser.workSchedule.vacations.filter((v) => v.id !== vacationId),
        },
      });
      toast.success('Szabadság törölve');
      loadSelectedUser();
    } catch (err) {
      console.error('Failed to delete vacation:', err);
      toast.error('Hiba a törléskor');
    }
  };

  const getVacationTypeLabel = (type: string) => {
    switch (type) {
      case 'vacation':
        return 'Szabadság';
      case 'sick':
        return 'Betegség';
      default:
        return 'Egyéb';
    }
  };

  const getVacationBadgeVariant = (type: string) => {
    switch (type) {
      case 'vacation':
        return 'success';
      case 'sick':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Munkarend</h1>
        <p className="text-sm text-gray-500 mt-1">Munkaidő és szabadságok kezelése</p>
      </div>

      <Card>
        <CardHeader>
          <Select
            id="user-select"
            label="Felhasználó kiválasztása"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            options={[
              { value: '', label: 'Válasszon felhasználót...' },
              ...users.map((u) => ({ value: u.id, label: u.name })),
            ]}
          />
        </CardHeader>
      </Card>

      {selectedUser && (
        <>
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">Munkaidő</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Input
                  id="workday-start"
                  type="time"
                  label="Munkaidő kezdete"
                  value={workdayStart}
                  onChange={(e) => setWorkdayStart(e.target.value)}
                  disabled={!canEdit}
                />
                <Input
                  id="workday-end"
                  type="time"
                  label="Munkaidő vége"
                  value={workdayEnd}
                  onChange={(e) => setWorkdayEnd(e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              {canEdit && (
                <Button onClick={handleSaveWorkday} disabled={saving}>
                  {saving ? 'Mentés...' : 'Munkaidő mentése'}
                </Button>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Szabadságok</h2>
              {canEdit && (
                <Button size="sm" onClick={() => openVacationModal()}>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Új szabadság
                </Button>
              )}
            </CardHeader>
            <CardBody className="p-0">
              {selectedUser.workSchedule.vacations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nincsenek rögzített szabadságok</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {selectedUser.workSchedule.vacations
                    .sort((a, b) => a.from.localeCompare(b.from))
                    .map((vacation) => (
                      <div
                        key={vacation.id}
                        className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <Badge variant={getVacationBadgeVariant(vacation.type) as 'default' | 'success' | 'warning' | 'danger' | 'info'}>
                            {getVacationTypeLabel(vacation.type)}
                          </Badge>
                          <div>
                            <p className="font-medium text-gray-900">
                              {vacation.from} - {vacation.to}
                            </p>
                            {vacation.note && (
                              <p className="text-sm text-gray-500">{vacation.note}</p>
                            )}
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openVacationModal(vacation)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVacation(vacation.id)}
                            >
                              <TrashIcon className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}

      <Modal
        isOpen={vacationModal}
        onClose={() => setVacationModal(false)}
        title={editingVacation ? 'Szabadság szerkesztése' : 'Új szabadság'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            id="vacation-from"
            type="date"
            label="Kezdő dátum *"
            value={vacationForm.from}
            onChange={(e) => setVacationForm({ ...vacationForm, from: e.target.value })}
          />
          <Input
            id="vacation-to"
            type="date"
            label="Záró dátum *"
            value={vacationForm.to}
            onChange={(e) => setVacationForm({ ...vacationForm, to: e.target.value })}
          />
          <Select
            id="vacation-type"
            label="Típus"
            value={vacationForm.type}
            onChange={(e) =>
              setVacationForm({ ...vacationForm, type: e.target.value as 'vacation' | 'sick' | 'other' })
            }
            options={[
              { value: 'vacation', label: 'Szabadság' },
              { value: 'sick', label: 'Betegség' },
              { value: 'other', label: 'Egyéb' },
            ]}
          />
          <Input
            id="vacation-note"
            label="Megjegyzés"
            value={vacationForm.note}
            onChange={(e) => setVacationForm({ ...vacationForm, note: e.target.value })}
            placeholder="Opcionális megjegyzés..."
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setVacationModal(false)}>
              Mégse
            </Button>
            <Button onClick={handleSaveVacation} disabled={saving}>
              {saving ? 'Mentés...' : 'Mentés'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
