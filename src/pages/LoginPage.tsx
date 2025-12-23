import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import { ROLE_LABELS } from '../types';
import { getAllUsers } from '../services/db';
import { loadSeedData } from '../services/seedData';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import toast from 'react-hot-toast';

export function LoginPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  useEffect(() => {
    async function init() {
      try {
        const result = await loadSeedData();
        if (result.usersLoaded > 0 || result.competenciesLoaded > 0) {
          toast.success(`Demo adatok betöltve: ${result.usersLoaded} felhasználó, ${result.competenciesLoaded} kompetencia`);
        }
        const allUsers = await getAllUsers();
        setUsers(allUsers.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error('Failed to load users:', err);
        toast.error('Hiba az adatok betöltésekor');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleLogin = (user: User) => {
    login(user);
    toast.success(`Üdvözöljük, ${user.name}!`);
    navigate('/users');
  };

  const handleLoadSeed = async () => {
    try {
      setLoading(true);
      const { clearAllData } = await import('../services/db');
      await clearAllData();
      const result = await loadSeedData();
      toast.success(`Demo adatok újratöltve: ${result.usersLoaded} felhasználó, ${result.competenciesLoaded} kompetencia`);
      const allUsers = await getAllUsers();
      setUsers(allUsers.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Failed to reload seed data:', err);
      toast.error('Hiba a demo adatok betöltésekor');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-900">TMS Bejelentkezés</h1>
          <p className="text-sm text-gray-500 mt-1">
            Válasszon egy felhasználót a bejelentkezéshez (demo mód)
          </p>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-500">Betöltés...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Nincsenek felhasználók az adatbázisban.</p>
              <Button onClick={handleLoadSeed}>Demo adatok betöltése</Button>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleLogin(user)}
                    className="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.jobTitle}</p>
                      </div>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button variant="secondary" size="sm" onClick={handleLoadSeed} className="w-full">
                  Demo adatok újratöltése
                </Button>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
