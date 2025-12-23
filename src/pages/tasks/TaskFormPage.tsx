import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { Task, Project, User, TaskType, Priority, Status } from '../../types';
import {
  getTaskById, getProjectById, createTask, updateTask,
  getAllTaskTypes, getAllPriorities, getAllStatuses, getAllUsers, getTasksByProject
} from '../../services/db';
import { useAuthStore } from '../../stores/authStore';
import { canEditTask, canEditTaskProgress } from '../../services/permissions';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { FileUpload } from '../../components/ui/FileUpload';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface FormData {
  typeId: string;
  name: string;
  code: string;
  descriptionRich: string;
  descriptionAttachmentIds: string[];
  assigneeUserIds: string[];
  dueDateTime: string;
  priorityId: string;
  statusId: string;
  estimatedHours: string;
  actualHours: string;
  parentTaskId: string;
}

export function TaskFormPage() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const [searchParams] = useSearchParams();
  const parentTaskIdParam = searchParams.get('parent');
  const navigate = useNavigate();
  const isEdit = !!taskId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [existingTask, setExistingTask] = useState<Task | null>(null);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const currentUser = useAuthStore((s) => s.currentUser);

  const [form, setForm] = useState<FormData>({
    typeId: '',
    name: '',
    code: '',
    descriptionRich: '',
    descriptionAttachmentIds: [],
    assigneeUserIds: [],
    dueDateTime: '',
    priorityId: '',
    statusId: '',
    estimatedHours: '',
    actualHours: '',
    parentTaskId: parentTaskIdParam || '',
  });

  const [errors, setErrors] = useState<{ name?: string; code?: string; typeId?: string }>({});

  useEffect(() => {
    async function loadData() {
      if (!projectId) return;
      try {
        const [projectData, types, prios, stats, allUsers, tasks] = await Promise.all([
          getProjectById(projectId),
          getAllTaskTypes(),
          getAllPriorities(),
          getAllStatuses(),
          getAllUsers(),
          getTasksByProject(projectId),
        ]);

        if (!projectData) {
          toast.error('Projekt nem található');
          navigate('/projects');
          return;
        }

        setProject(projectData);
        setTaskTypes(types);
        setPriorities(prios);
        setStatuses(stats);
        setProjectTasks(tasks);
        setUsers(allUsers.filter((u) => projectData.team.some((t) => t.userId === u.id)));

        // Set defaults
        if (!isEdit) {
          setForm((f) => ({
            ...f,
            typeId: types[0]?.id || '',
            priorityId: prios.find((p) => p.order === 3)?.id || prios[0]?.id || '',
            statusId: stats.find((s) => s.order === 1)?.id || stats[0]?.id || '',
          }));
        }

        if (taskId) {
          const task = await getTaskById(taskId);
          if (task) {
            setExistingTask(task);
            setForm({
              typeId: task.typeId,
              name: task.name,
              code: task.code,
              descriptionRich: task.descriptionRich || '',
              descriptionAttachmentIds: task.descriptionAttachmentIds,
              assigneeUserIds: task.assigneeUserIds,
              dueDateTime: task.dueDateTime ? task.dueDateTime.slice(0, 16) : '',
              priorityId: task.priorityId,
              statusId: task.statusId,
              estimatedHours: task.estimatedHours?.toString() || '',
              actualHours: task.actualHours?.toString() || '',
              parentTaskId: task.parentTaskId || '',
            });
          } else {
            toast.error('Feladat nem található');
            navigate(`/projects/${projectId}`);
          }
        }
      } catch (err) {
        console.error('Failed to load:', err);
        toast.error('Hiba a betöltéskor');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId, taskId, isEdit, navigate, parentTaskIdParam]);

  const canEditFull = currentUser ? canEditTask(currentUser.role) : false;
  const canEditProgress = currentUser && existingTask
    ? canEditTaskProgress(currentUser.role, existingTask.assigneeUserIds, currentUser.id)
    : false;

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!form.name.trim()) newErrors.name = 'A név kötelező';
    if (!form.code.trim()) newErrors.code = 'A kód kötelező';
    else {
      const duplicate = projectTasks.find(
        (t) => t.code.toLowerCase() === form.code.trim().toLowerCase() && t.id !== existingTask?.id
      );
      if (duplicate) newErrors.code = 'Ez a kód már létezik a projektben';
    }
    if (!form.typeId) newErrors.typeId = 'A típus kötelező';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !project) return;

    setSaving(true);
    try {
      const taskData: Task = {
        id: existingTask?.id || uuidv4(),
        projectId: project.id,
        parentTaskId: form.parentTaskId || undefined,
        typeId: form.typeId,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        descriptionRich: form.descriptionRich || undefined,
        descriptionAttachmentIds: form.descriptionAttachmentIds,
        assigneeUserIds: form.assigneeUserIds,
        dueDateTime: form.dueDateTime ? new Date(form.dueDateTime).toISOString() : undefined,
        priorityId: form.priorityId,
        statusId: form.statusId,
        estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : undefined,
        actualHours: form.actualHours ? parseFloat(form.actualHours) : undefined,
        createdAt: existingTask?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isEdit) {
        await updateTask(taskData);
        toast.success('Feladat frissítve');
      } else {
        await createTask(taskData);
        toast.success('Feladat létrehozva');
      }

      navigate(`/projects/${project.id}`);
    } catch (err) {
      console.error('Failed to save:', err);
      toast.error('Hiba a mentéskor');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  if (!project) return null;

  const rootTasks = projectTasks.filter((t) => !t.parentTaskId && t.id !== existingTask?.id);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/projects/${project.id}`)}>
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Feladat szerkesztése' : 'Új feladat'}
          </h1>
          <p className="text-sm text-gray-500">{project.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><h2 className="text-lg font-semibold">Alapadatok</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                id="typeId"
                label="Típus *"
                value={form.typeId}
                onChange={(e) => setForm({ ...form, typeId: e.target.value })}
                options={taskTypes.map((t) => ({ value: t.id, label: t.name }))}
                error={errors.typeId}
                disabled={!canEditFull}
              />
              <Input
                id="code"
                label="Kód *"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                error={errors.code}
                disabled={!canEditFull}
              />
            </div>
            <Input
              id="name"
              label="Név *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
              disabled={!canEditFull}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leírás</label>
              <textarea
                value={form.descriptionRich}
                onChange={(e) => setForm({ ...form, descriptionRich: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canEditFull}
              />
            </div>
            <FileUpload
              label="Csatolmányok"
              attachmentIds={form.descriptionAttachmentIds}
              onChange={(ids) => setForm({ ...form, descriptionAttachmentIds: ids })}
              disabled={!canEditFull}
            />
            {rootTasks.length > 0 && (
              <Select
                id="parentTaskId"
                label="Szülő feladat (részfeladathoz)"
                value={form.parentTaskId}
                onChange={(e) => setForm({ ...form, parentTaskId: e.target.value })}
                options={[
                  { value: '', label: '-- Nincs (főfeladat) --' },
                  ...rootTasks.map((t) => ({ value: t.id, label: `${t.code} - ${t.name}` })),
                ]}
                disabled={!canEditFull}
              />
            )}
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardHeader><h2 className="text-lg font-semibold">Hozzárendelés és időzítés</h2></CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Felelősök</label>
              <div className="space-y-2">
                {users.map((user) => (
                  <label key={user.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.assigneeUserIds.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({ ...form, assigneeUserIds: [...form.assigneeUserIds, user.id] });
                        } else {
                          setForm({ ...form, assigneeUserIds: form.assigneeUserIds.filter((id) => id !== user.id) });
                        }
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      disabled={!canEditFull}
                    />
                    <span className="text-sm text-gray-700">{user.name}</span>
                  </label>
                ))}
              </div>
              {users.length === 0 && (
                <p className="text-sm text-gray-500">A projekt csapatában nincs tag</p>
              )}
            </div>
            <Input
              id="dueDateTime"
              type="datetime-local"
              label="Határidő"
              value={form.dueDateTime}
              onChange={(e) => setForm({ ...form, dueDateTime: e.target.value })}
              disabled={!canEditFull}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                id="priorityId"
                label="Prioritás *"
                value={form.priorityId}
                onChange={(e) => setForm({ ...form, priorityId: e.target.value })}
                options={priorities.map((p) => ({ value: p.id, label: p.name }))}
                disabled={!canEditFull && !canEditProgress}
              />
              <Select
                id="statusId"
                label="Státusz *"
                value={form.statusId}
                onChange={(e) => setForm({ ...form, statusId: e.target.value })}
                options={statuses.map((s) => ({ value: s.id, label: s.name }))}
                disabled={!canEditFull && !canEditProgress}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="estimatedHours"
                type="number"
                label="Becsült órák"
                value={form.estimatedHours}
                onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
                min={0}
                step={0.5}
                disabled={!canEditFull}
              />
              <Input
                id="actualHours"
                type="number"
                label="Tényleges órák"
                value={form.actualHours}
                onChange={(e) => setForm({ ...form, actualHours: e.target.value })}
                min={0}
                step={0.5}
                disabled={!canEditFull && !canEditProgress}
              />
            </div>
          </CardBody>
        </Card>

        {(canEditFull || canEditProgress) && (
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => navigate(`/projects/${project.id}`)}>
              Mégse
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Mentés...' : isEdit ? 'Mentés' : 'Létrehozás'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
