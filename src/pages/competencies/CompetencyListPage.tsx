import { useState, useEffect } from 'react';
import type { Competency } from '../../types';
import { getAllCompetencies, createCompetency, updateCompetency, deleteCompetency } from '../../services/db';
import { useAuthStore } from '../../stores/authStore';
import { canManageCompetencies } from '../../services/permissions';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';

interface FormData {
  name: string;
  category: string;
}

export function CompetencyListPage() {
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<Competency | null>(null);
  const [form, setForm] = useState<FormData>({ name: '', category: '' });
  const [saving, setSaving] = useState(false);

  const currentUser = useAuthStore((s) => s.currentUser);
  const canManage = currentUser ? canManageCompetencies(currentUser.role) : false;

  useEffect(() => {
    loadCompetencies();
  }, []);

  const loadCompetencies = async () => {
    try {
      const all = await getAllCompetencies();
      setCompetencies(all.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Failed to load competencies:', err);
      toast.error('Hiba a kompetenciák betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  if (!canManage) {
    return <Navigate to="/users" replace />;
  }

  const filteredCompetencies = competencies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(competencies.map((c) => c.category).filter(Boolean))];

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ name: '', category: '' });
    setModalOpen(true);
  };

  const openEditModal = (comp: Competency) => {
    setEditingId(comp.id);
    setForm({ name: comp.name, category: comp.category || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('A név megadása kötelező');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateCompetency({
          id: editingId,
          name: form.name.trim(),
          category: form.category.trim() || undefined,
          createdAt: competencies.find((c) => c.id === editingId)?.createdAt || new Date().toISOString(),
        });
        toast.success('Kompetencia frissítve');
      } else {
        await createCompetency({
          id: uuidv4(),
          name: form.name.trim(),
          category: form.category.trim() || undefined,
          createdAt: new Date().toISOString(),
        });
        toast.success('Kompetencia létrehozva');
      }
      setModalOpen(false);
      loadCompetencies();
    } catch (err) {
      console.error('Failed to save competency:', err);
      toast.error('Hiba a mentéskor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteCompetency(deleteModal.id);
      toast.success('Kompetencia törölve');
      setDeleteModal(null);
      loadCompetencies();
    } catch (err) {
      console.error('Failed to delete competency:', err);
      toast.error('Hiba a törléskor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kompetencia katalógus</h1>
          <p className="text-sm text-gray-500 mt-1">{competencies.length} kompetencia</p>
        </div>
        <Button onClick={openCreateModal}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Új kompetencia
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Keresés név vagy kategória alapján..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-500">Betöltés...</p>
            </div>
          ) : filteredCompetencies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nincs találat</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCompetencies.map((comp) => (
                <div
                  key={comp.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{comp.name}</p>
                    {comp.category && <p className="text-sm text-gray-500">{comp.category}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(comp)}>
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteModal(comp)}>
                      <TrashIcon className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Kompetencia szerkesztése' : 'Új kompetencia'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            id="comp-name"
            label="Név *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="pl. JavaScript"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategória</label>
            <input
              type="text"
              list="categories"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="pl. Programozás"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <datalist id="categories">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Mégse
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Mentés...' : 'Mentés'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Kompetencia törlése"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Biztosan törölni szeretné a <strong>{deleteModal?.name}</strong> kompetenciát? Ez a művelet
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
