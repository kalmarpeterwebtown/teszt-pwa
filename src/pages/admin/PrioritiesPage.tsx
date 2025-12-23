import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { Priority } from '../../types';
import { getAllPriorities, createPriority, updatePriority, deletePriority } from '../../services/db';
import { useAuthStore } from '../../stores/authStore';
import { canManageMasterData } from '../../services/permissions';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface FormData {
  name: string;
  order: number;
}

export function PrioritiesPage() {
  const [items, setItems] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<Priority | null>(null);
  const [form, setForm] = useState<FormData>({ name: '', order: 1 });
  const [saving, setSaving] = useState(false);

  const currentUser = useAuthStore((s) => s.currentUser);
  const canManage = currentUser ? canManageMasterData(currentUser.role) : false;

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const all = await getAllPriorities();
      setItems(all);
    } catch (err) {
      console.error('Failed to load:', err);
      toast.error('Hiba a betöltéskor');
    } finally {
      setLoading(false);
    }
  };

  if (!canManage) {
    return <Navigate to="/projects" replace />;
  }

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ name: '', order: items.length + 1 });
    setModalOpen(true);
  };

  const openEditModal = (item: Priority) => {
    setEditingId(item.id);
    setForm({ name: item.name, order: item.order });
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
        await updatePriority({
          id: editingId,
          name: form.name.trim(),
          order: form.order,
          createdAt: items.find((i) => i.id === editingId)?.createdAt || new Date().toISOString(),
        });
        toast.success('Prioritás frissítve');
      } else {
        await createPriority({
          id: uuidv4(),
          name: form.name.trim(),
          order: form.order,
          createdAt: new Date().toISOString(),
        });
        toast.success('Prioritás létrehozva');
      }
      setModalOpen(false);
      loadItems();
    } catch (err) {
      console.error('Failed to save:', err);
      toast.error('Hiba a mentéskor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await deletePriority(deleteModal.id);
      toast.success('Prioritás törölve');
      setDeleteModal(null);
      loadItems();
    } catch (err) {
      console.error('Failed to delete:', err);
      toast.error('Hiba a törléskor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prioritások</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} prioritás</p>
        </div>
        <Button onClick={openCreateModal}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Új prioritás
        </Button>
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm text-gray-500">A sorrend (order) határozza meg a prioritás fontosságát (kisebb = fontosabb)</p>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Nincsenek prioritások</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {item.order}
                    </span>
                    <p className="font-medium text-gray-900">{item.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}><PencilIcon className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteModal(item)}><TrashIcon className="h-4 w-4 text-red-500" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Prioritás szerkesztése' : 'Új prioritás'} size="sm">
        <div className="space-y-4">
          <Input id="name" label="Név *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input
            id="order"
            type="number"
            label="Sorrend *"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })}
            min={1}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Mégse</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Mentés...' : 'Mentés'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Prioritás törlése" size="sm">
        <p className="text-gray-600 mb-6">Biztosan törli a <strong>{deleteModal?.name}</strong> prioritást?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteModal(null)}>Mégse</Button>
          <Button variant="danger" onClick={handleDelete}>Törlés</Button>
        </div>
      </Modal>
    </div>
  );
}
