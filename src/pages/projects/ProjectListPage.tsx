import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Project, ProjectTag, User } from '../../types';
import { PROJECT_TYPE_LABELS, ALL_PROJECT_TYPES } from '../../types';
import { getAllProjects, getAllProjectTags, getAllUsers, deleteProject } from '../../services/db';
import { useAuthStore } from '../../stores/authStore';
import { canCreateProject, canDeleteProject, hasProjectAccess } from '../../services/permissions';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, EyeIcon, UsersIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<ProjectTag[]>([]);
  const [_users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [deleteModal, setDeleteModal] = useState<Project | null>(null);
  
  const currentUser = useAuthStore((s) => s.currentUser);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [allProjects, allTags, allUsers] = await Promise.all([
        getAllProjects(),
        getAllProjectTags(),
        getAllUsers(),
      ]);
      setProjects(allProjects.sort((a, b) => a.name.localeCompare(b.name)));
      setTags(allTags);
      setUsers(allUsers);
    } catch (err) {
      console.error('Failed to load:', err);
      toast.error('Hiba a betöltéskor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const accessibleProjects = projects.filter((project) =>
    currentUser ? hasProjectAccess(currentUser.role, currentUser.id, project.team) : false
  );

  const filteredProjects = accessibleProjects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.code.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || project.type === typeFilter;
    const matchesTag = tagFilter === 'all' || project.tagIds.includes(tagFilter);
    return matchesSearch && matchesType && matchesTag;
  });

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteProject(deleteModal.id);
      toast.success('Projekt törölve');
      setDeleteModal(null);
      loadData();
    } catch (err) {
      console.error('Failed to delete:', err);
      toast.error('Hiba a törléskor');
    }
  };

  const getTagNames = (tagIds: string[]) => {
    return tagIds.map((id) => tags.find((t) => t.id === id)?.name).filter(Boolean);
  };

  const getTeamCount = (team: Project['team']) => team.length;

  const canCreate = currentUser ? canCreateProject(currentUser.role) : false;
  const canDelete = currentUser ? canDeleteProject(currentUser.role) : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projektek</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredProjects.length} projekt
            {filteredProjects.length !== accessibleProjects.length && ` (szűrve: ${accessibleProjects.length} elérhető)`}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/projects/new')}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Új projekt
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Keresés név vagy kód alapján..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Minden típus' },
                ...ALL_PROJECT_TYPES.map((t) => ({ value: t, label: PROJECT_TYPE_LABELS[t] })),
              ]}
              className="w-full sm:w-48"
            />
            <Select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Minden címke' },
                ...tags.map((t) => ({ value: t.id, label: t.name })),
              ]}
              className="w-full sm:w-48"
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Nincs találat</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <div key={project.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Link
                          to={`/projects/${project.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-blue-600 truncate"
                        >
                          {project.name}
                        </Link>
                        <Badge variant="info">{project.code}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span>{PROJECT_TYPE_LABELS[project.type]}</span>
                        <span className="flex items-center gap-1">
                          <UsersIcon className="h-4 w-4" />
                          {getTeamCount(project.team)} tag
                        </span>
                      </div>
                      {project.tagIds.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {getTagNames(project.tagIds).map((name) => (
                            <Badge key={name} variant="default">{name}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${project.id}`)}>
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      {canCreate && (
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${project.id}/edit`)}>
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="sm" onClick={() => setDeleteModal(project)}>
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Projekt törlése" size="sm">
        <p className="text-gray-600 mb-6">
          Biztosan törli a <strong>{deleteModal?.name}</strong> projektet és az összes hozzá tartozó feladatot?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteModal(null)}>Mégse</Button>
          <Button variant="danger" onClick={handleDelete}>Törlés</Button>
        </div>
      </Modal>
    </div>
  );
}
