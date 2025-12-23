import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Task, Project, User, TaskType, Priority, Status } from '../../types';
import {
  getTaskById, getProjectById, getSubtasks, deleteTask,
  getAllTaskTypes, getAllPriorities, getAllStatuses, getAllUsers
} from '../../services/db';
import { useAuthStore } from '../../stores/authStore';
import { canEditTask, canDeleteTask, canEditTaskProgress } from '../../services/permissions';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { FileUpload } from '../../components/ui/FileUpload';
import { ArrowLeftIcon, PencilIcon, TrashIcon, PlusIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function TaskDetailPage() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const currentUser = useAuthStore((s) => s.currentUser);

  useEffect(() => {
    async function loadData() {
      if (!projectId || !taskId) return;
      try {
        const [taskData, projectData, taskSubtasks, types, prios, stats, allUsers] = await Promise.all([
          getTaskById(taskId),
          getProjectById(projectId),
          getSubtasks(taskId),
          getAllTaskTypes(),
          getAllPriorities(),
          getAllStatuses(),
          getAllUsers(),
        ]);

        if (!taskData || !projectData) {
          toast.error('Feladat vagy projekt nem található');
          navigate('/projects');
          return;
        }

        setTask(taskData);
        setProject(projectData);
        setSubtasks(taskSubtasks);
        setTaskTypes(types);
        setPriorities(prios);
        setStatuses(stats);
        setUsers(allUsers);
      } catch (err) {
        console.error('Failed to load:', err);
        toast.error('Hiba a betöltéskor');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId, taskId, navigate]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  if (!task || !project) return null;

  const canEdit = currentUser ? canEditTask(currentUser.role) : false;
  const canDelete = currentUser ? canDeleteTask(currentUser.role) : false;
  const canEditProgress = currentUser
    ? canEditTaskProgress(currentUser.role, task.assigneeUserIds, currentUser.id)
    : false;

  const getTaskType = (typeId: string) => taskTypes.find((t) => t.id === typeId);
  const getPriority = (priorityId: string) => priorities.find((p) => p.id === priorityId);
  const getStatus = (statusId: string) => statuses.find((s) => s.id === statusId);
  const getUser = (userId: string) => users.find((u) => u.id === userId);

  const status = getStatus(task.statusId);
  const priority = getPriority(task.priorityId);

  const getStatusBadgeVariant = () => {
    if (!status) return 'default';
    if (status.isFinal && status.name === 'Done') return 'success';
    if (status.isFinal) return 'default';
    if (status.name === 'In progress') return 'info';
    return 'warning';
  };

  const getPriorityBadgeVariant = () => {
    if (!priority) return 'default';
    if (priority.order === 1) return 'danger';
    if (priority.order === 2) return 'warning';
    return 'default';
  };

  const formatDateTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async () => {
    try {
      await deleteTask(task.id);
      toast.success('Feladat törölve');
      navigate(`/projects/${project.id}`);
    } catch (err) {
      console.error('Failed to delete:', err);
      toast.error('Hiba a törléskor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/projects/${project.id}`)}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{task.code}</span>
              <h1 className="text-2xl font-bold text-gray-900">{task.name}</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              <Link to={`/projects/${project.id}`} className="hover:text-blue-600">{project.name}</Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(canEdit || canEditProgress) && (
            <Button onClick={() => navigate(`/projects/${project.id}/tasks/${task.id}/edit`)}>
              <PencilIcon className="h-5 w-5 mr-2" />
              Szerkesztés
            </Button>
          )}
          {canDelete && (
            <Button variant="danger" onClick={() => setDeleteModal(true)}>
              <TrashIcon className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={getStatusBadgeVariant()}>{status?.name}</Badge>
        <Badge variant={getPriorityBadgeVariant()}>{priority?.name}</Badge>
        <Badge>{getTaskType(task.typeId)?.name}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h2 className="text-lg font-semibold">Részletek</h2></CardHeader>
          <CardBody className="space-y-4">
            {task.descriptionRich && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Leírás</p>
                <p className="text-gray-900 whitespace-pre-wrap">{task.descriptionRich}</p>
              </div>
            )}
            {task.descriptionAttachmentIds.length > 0 && (
              <FileUpload
                label="Csatolmányok"
                attachmentIds={task.descriptionAttachmentIds}
                onChange={() => {}}
                disabled
              />
            )}
            {task.parentTaskId && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Szülő feladat</p>
                <Link
                  to={`/projects/${project.id}/tasks/${task.parentTaskId}`}
                  className="text-blue-600 hover:underline"
                >
                  Szülő feladat megtekintése →
                </Link>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="text-lg font-semibold">Időzítés és erőforrás</h2></CardHeader>
          <CardBody className="space-y-4">
            {task.dueDateTime && (
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Határidő</p>
                  <p className="font-medium text-gray-900">{formatDateTime(task.dueDateTime)}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Munkaidő</p>
                <p className="font-medium text-gray-900">
                  {task.actualHours || 0} / {task.estimatedHours || '?'} óra
                </p>
              </div>
            </div>
            {task.assigneeUserIds.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Felelősök</p>
                <div className="space-y-1">
                  {task.assigneeUserIds.map((userId) => {
                    const user = getUser(userId);
                    return (
                      <div key={userId} className="text-sm text-gray-900">
                        {user?.name || 'Ismeretlen'}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Subtasks */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Részfeladatok ({subtasks.length})</h2>
          {canEdit && (
            <Button size="sm" onClick={() => navigate(`/projects/${project.id}/tasks/new?parent=${task.id}`)}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Új részfeladat
            </Button>
          )}
        </CardHeader>
        <CardBody className="p-0">
          {subtasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nincsenek részfeladatok</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {subtasks.map((subtask) => (
                <Link
                  key={subtask.id}
                  to={`/projects/${project.id}/tasks/${subtask.id}`}
                  className="block p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{subtask.code}</span>
                        <span className="font-medium text-gray-900">{subtask.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant()}>{getStatus(subtask.statusId)?.name}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Feladat törlése" size="sm">
        <p className="text-gray-600 mb-6">
          Biztosan törli a <strong>{task.name}</strong> feladatot
          {subtasks.length > 0 && ` és ${subtasks.length} részfeladatát`}?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteModal(false)}>Mégse</Button>
          <Button variant="danger" onClick={handleDelete}>Törlés</Button>
        </div>
      </Modal>
    </div>
  );
}
