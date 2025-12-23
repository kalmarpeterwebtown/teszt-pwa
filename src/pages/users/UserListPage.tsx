import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { User, Role } from '../../types';
import { ROLE_LABELS, ALL_ROLES } from '../../types';
import { getAllUsers, deleteUser } from '../../services/db';
import { useAuthStore } from '../../stores/authStore';
import { canCreateUser, canDeleteUser, canEditTargetUser } from '../../services/permissions';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deleteModal, setDeleteModal] = useState<User | null>(null);
  const currentUser = useAuthStore((s) => s.currentUser);
  const navigate = useNavigate();

  const loadUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Hiba a felhasználók betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.contacts.email.toLowerCase().includes(search.toLowerCase()) ||
      user.jobTitle.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteUser(deleteModal.id);
      toast.success('Felhasználó törölve');
      setDeleteModal(null);
      loadUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      toast.error('Hiba a törléskor');
    }
  };

  const getRoleBadgeVariant = (role: Role) => {
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

  const canCreate = currentUser ? canCreateUser(currentUser.role) : false;
  const canDelete = currentUser ? canDeleteUser(currentUser.role) : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Felhasználók</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredUsers.length} felhasználó{' '}
            {filteredUsers.length !== users.length && `(szűrve: ${users.length} összesen)`}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/users/new')}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Új felhasználó
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Keresés név, email vagy munkakör alapján..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Minden szerepkör' },
                ...ALL_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
              ]}
              className="w-full sm:w-48"
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-500">Betöltés...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nincs találat</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Név
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Munkakör
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Szerepkör
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Műveletek
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
                    const canEdit = currentUser
                      ? canEditTargetUser(currentUser.role, user.role)
                      : false;
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/users/${user.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            {user.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.contacts.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.jobTitle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/users/${user.id}`)}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/users/${user.id}/edit`)}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && user.id !== currentUser?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteModal(user)}
                              >
                                <TrashIcon className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Felhasználó törlése"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Biztosan törölni szeretné <strong>{deleteModal?.name}</strong> felhasználót? Ez a művelet
          nem vonható vissza.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteModal(null)}>
            Mégse
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Törlés
          </Button>
        </div>
      </Modal>
    </div>
  );
}
