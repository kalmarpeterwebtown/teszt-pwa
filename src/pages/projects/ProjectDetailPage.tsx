import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Project, ProjectTag, User, Task, Priority, Status, TaskType } from '../../types';
import { PROJECT_TYPE_LABELS, PROJECT_ROLE_LABELS } from '../../types';
import { getProjectById, getAllProjectTags, getAllUsers, getTasksByProject, getAllPriorities, getAllStatuses, getAllTaskTypes } from '../../services/db';
import { useAuthStore } from '../../stores/authStore';
import { canEditProject, canCreateTask, hasProjectAccess } from '../../services/permissions';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { FileUpload } from '../../components/ui/FileUpload';
import { ArrowLeftIcon, PencilIcon, PlusIcon, UsersIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tags, setTags] = useState<ProjectTag[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'team' | 'tasks'>('details');
  const currentUser = useAuthStore((s) => s.currentUser);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const [projectData, allTags, allUsers, projectTasks, allPriorities, allStatuses, allTypes] = await Promise.all([
          getProjectById(id),
          getAllProjectTags(),
          getAllUsers(),
          getTasksByProject(id),
          getAllPriorities(),
          getAllStatuses(),
          getAllTaskTypes(),
        ]);

        if (projectData) {
          setProject(projectData);
          setTags(allTags);
          setUsers(allUsers);
          setTasks(projectTasks);
          setPriorities(allPriorities);
          setStatuses(allStatuses);
          setTaskTypes(allTypes);
        } else {
          toast.error('Projekt nem található');
          navigate('/projects');
        }
      } catch (err) {
        console.error('Failed to load:', err);
        toast.error('Hiba a betöltéskor');
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
      </div>
    );
  }

  if (!project) return null;

  const canEdit = currentUser ? canEditProject(currentUser.role) : false;
  const canAddTask = currentUser ? canCreateTask(currentUser.role) : false;
  const hasAccess = currentUser ? hasProjectAccess(currentUser.role, currentUser.id, project.team) : false;

  if (!hasAccess) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nincs hozzáférése ehhez a projekthez</p>
        <Button className="mt-4" onClick={() => navigate('/projects')}>Vissza a projektekhez</Button>
      </div>
    );
  }

  const getTagNames = (tagIds: string[]) => tags.filter((t) => tagIds.includes(t.id));
  const getUser = (userId: string) => users.find((u) => u.id === userId);
  const getPriority = (priorityId: string) => priorities.find((p) => p.id === priorityId);
  const getStatus = (statusId: string) => statuses.find((s) => s.id === statusId);
  const getTaskType = (typeId: string) => taskTypes.find((t) => t.id === typeId);

  const rootTasks = tasks.filter((t) => !t.parentTaskId);
  const getSubtasks = (parentId: string) => tasks.filter((t) => t.parentTaskId === parentId);

  const getStatusBadgeVariant = (statusId: string) => {
    const status = getStatus(statusId);
    if (!status) return 'default';
    if (status.isFinal && status.name === 'Done') return 'success';
    if (status.isFinal) return 'default';
    if (status.name === 'In progress') return 'info';
    return 'warning';
  };

  const getPriorityBadgeVariant = (priorityId: string) => {
    const priority = getPriority(priorityId);
    if (!priority) return 'default';
    if (priority.order === 1) return 'danger';
    if (priority.order === 2) return 'warning';
    return 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/projects')}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <Badge variant="info">{project.code}</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">{PROJECT_TYPE_LABELS[project.type]}</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => navigate(`/projects/${project.id}/edit`)}>
            <PencilIcon className="h-5 w-5 mr-2" />
            Szerkesztés
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Részletek
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 ${
              activeTab === 'team'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <UsersIcon className="h-4 w-4" />
            Csapat ({project.team.length})
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ClipboardDocumentListIcon className="h-4 w-4" />
            Feladatok ({tasks.length})
          </button>
        </nav>
      </div>

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Alapadatok</h2></CardHeader>
            <CardBody className="space-y-4">
              {project.descriptionRich && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Leírás</p>
                  <p className="text-gray-900">{project.descriptionRich}</p>
                </div>
              )}
              {project.expectedSmartOutcome && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Elvárt eredmény</p>
                  <p className="text-gray-900">{project.expectedSmartOutcome}</p>
                </div>
              )}
              {project.tagIds.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Címkék</p>
                  <div className="flex flex-wrap gap-1">
                    {getTagNames(project.tagIds).map((tag) => (
                      <Badge key={tag.id}>{tag.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-lg font-semibold">Célok és KPI</h2></CardHeader>
            <CardBody className="space-y-4">
              {project.goalsRich && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Vállalati célok</p>
                  <p className="text-gray-900">{project.goalsRich}</p>
                </div>
              )}
              {project.goalsAttachmentIds.length > 0 && (
                <FileUpload
                  label="Célok csatolmányai"
                  attachmentIds={project.goalsAttachmentIds}
                  onChange={() => {}}
                  disabled
                />
              )}
              {project.kpiRich && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">KPI-ok</p>
                  <p className="text-gray-900">{project.kpiRich}</p>
                </div>
              )}
              {project.kpiAttachmentIds.length > 0 && (
                <FileUpload
                  label="KPI csatolmányai"
                  attachmentIds={project.kpiAttachmentIds}
                  onChange={() => {}}
                  disabled
                />
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'team' && (
        <Card>
          <CardBody>
            {project.team.length === 0 ? (
              <p className="text-gray-500">Nincs csapattag</p>
            ) : (
              <div className="divide-y divide-gray-200">
                {project.team.map((member) => {
                  const user = getUser(member.userId);
                  return (
                    <div key={member.userId} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{user?.name || 'Ismeretlen'}</p>
                        <p className="text-sm text-gray-500">{user?.jobTitle}</p>
                      </div>
                      <Badge variant="info">{PROJECT_ROLE_LABELS[member.roleInProject]}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {canAddTask && (
            <div className="flex justify-end">
              <Button onClick={() => navigate(`/projects/${project.id}/tasks/new`)}>
                <PlusIcon className="h-5 w-5 mr-2" />
                Új feladat
              </Button>
            </div>
          )}

          {rootTasks.length === 0 ? (
            <Card>
              <CardBody className="text-center py-8 text-gray-500">
                Nincsenek feladatok
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody className="p-0">
                <div className="divide-y divide-gray-200">
                  {rootTasks.map((task) => {
                    const subtasks = getSubtasks(task.id);
                    return (
                      <div key={task.id}>
                        <Link
                          to={`/projects/${project.id}/tasks/${task.id}`}
                          className="block p-4 hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm text-gray-500">{task.code}</span>
                                <span className="font-medium text-gray-900">{task.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Badge variant={getStatusBadgeVariant(task.statusId)}>
                                  {getStatus(task.statusId)?.name}
                                </Badge>
                                <Badge variant={getPriorityBadgeVariant(task.priorityId)}>
                                  {getPriority(task.priorityId)?.name}
                                </Badge>
                                <span className="text-gray-500">{getTaskType(task.typeId)?.name}</span>
                              </div>
                            </div>
                            {task.assigneeUserIds.length > 0 && (
                              <div className="text-sm text-gray-500">
                                {task.assigneeUserIds.map((uid) => getUser(uid)?.name).join(', ')}
                              </div>
                            )}
                          </div>
                        </Link>
                        {subtasks.length > 0 && (
                          <div className="pl-8 bg-gray-50">
                            {subtasks.map((subtask) => (
                              <Link
                                key={subtask.id}
                                to={`/projects/${project.id}/tasks/${subtask.id}`}
                                className="block p-3 border-l-2 border-gray-300 hover:bg-gray-100"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">{subtask.code}</span>
                                  <span className="text-sm text-gray-900">{subtask.name}</span>
                                  <Badge variant={getStatusBadgeVariant(subtask.statusId)} className="text-xs">
                                    {getStatus(subtask.statusId)?.name}
                                  </Badge>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
