import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { Project, ProjectTag, User, ProjectType, ProjectRole } from '../../types';
import { PROJECT_TYPE_LABELS, ALL_PROJECT_TYPES, PROJECT_ROLE_LABELS, ALL_PROJECT_ROLES } from '../../types';
import { getProjectById, getProjectByCode, createProject, updateProject, getAllProjectTags, getAllUsers } from '../../services/db';
import { useAuthStore } from '../../stores/authStore';
import { canCreateProject } from '../../services/permissions';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { TagSelect } from '../../components/ui/TagSelect';
import { FileUpload } from '../../components/ui/FileUpload';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface FormData {
  type: ProjectType;
  name: string;
  code: string;
  descriptionRich: string;
  goalsRich: string;
  goalsAttachmentIds: string[];
  kpiRich: string;
  kpiAttachmentIds: string[];
  expectedSmartOutcome: string;
  tagIds: string[];
  team: { userId: string; roleInProject: ProjectRole }[];
}

interface FormErrors {
  name?: string;
  code?: string;
}

export function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState<ProjectTag[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [existingProject, setExistingProject] = useState<Project | null>(null);
  const currentUser = useAuthStore((s) => s.currentUser);

  const [form, setForm] = useState<FormData>({
    type: 'DEVELOPMENT',
    name: '',
    code: '',
    descriptionRich: '',
    goalsRich: '',
    goalsAttachmentIds: [],
    kpiRich: '',
    kpiAttachmentIds: [],
    expectedSmartOutcome: '',
    tagIds: [],
    team: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    async function loadData() {
      try {
        const [allTags, allUsers] = await Promise.all([getAllProjectTags(), getAllUsers()]);
        setTags(allTags);
        setUsers(allUsers);

        if (id) {
          const project = await getProjectById(id);
          if (project) {
            setExistingProject(project);
            setForm({
              type: project.type,
              name: project.name,
              code: project.code,
              descriptionRich: project.descriptionRich || '',
              goalsRich: project.goalsRich || '',
              goalsAttachmentIds: project.goalsAttachmentIds,
              kpiRich: project.kpiRich || '',
              kpiAttachmentIds: project.kpiAttachmentIds,
              expectedSmartOutcome: project.expectedSmartOutcome || '',
              tagIds: project.tagIds,
              team: project.team,
            });
          } else {
            toast.error('Projekt nem található');
            navigate('/projects');
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
  }, [id, navigate]);

  const canEdit = currentUser ? canCreateProject(currentUser.role) : false;

  const validateForm = async (): Promise<boolean> => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'A név megadása kötelező';
    }

    if (!form.code.trim()) {
      newErrors.code = 'A kód megadása kötelező';
    } else {
      const existing = await getProjectByCode(form.code.trim());
      if (existing && existing.id !== existingProject?.id) {
        newErrors.code = 'Ez a kód már használatban van';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!await validateForm()) return;

    setSaving(true);
    try {
      const projectData: Project = {
        id: existingProject?.id || uuidv4(),
        type: form.type,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        descriptionRich: form.descriptionRich || undefined,
        goalsRich: form.goalsRich || undefined,
        goalsAttachmentIds: form.goalsAttachmentIds,
        kpiRich: form.kpiRich || undefined,
        kpiAttachmentIds: form.kpiAttachmentIds,
        expectedSmartOutcome: form.expectedSmartOutcome || undefined,
        tagIds: form.tagIds,
        team: form.team,
        createdAt: existingProject?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isEdit) {
        await updateProject(projectData);
        toast.success('Projekt frissítve');
      } else {
        await createProject(projectData);
        toast.success('Projekt létrehozva');
      }

      navigate('/projects');
    } catch (err) {
      console.error('Failed to save:', err);
      toast.error('Hiba a mentéskor');
    } finally {
      setSaving(false);
    }
  };

  const addTeamMember = () => {
    const availableUsers = users.filter((u) => !form.team.some((t) => t.userId === u.id));
    if (availableUsers.length === 0) {
      toast.error('Nincs több elérhető felhasználó');
      return;
    }
    setForm({
      ...form,
      team: [...form.team, { userId: availableUsers[0].id, roleInProject: 'MEMBER' }],
    });
  };

  const removeTeamMember = (userId: string) => {
    setForm({
      ...form,
      team: form.team.filter((t) => t.userId !== userId),
    });
  };

  const updateTeamMember = (userId: string, field: 'userId' | 'roleInProject', value: string) => {
    setForm({
      ...form,
      team: form.team.map((t) =>
        t.userId === userId ? { ...t, [field]: value } : t
      ),
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/projects')}>
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Projekt szerkesztése' : 'Új projekt'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><h2 className="text-lg font-semibold">Alapadatok</h2></CardHeader>
          <CardBody className="space-y-4">
            <Select
              id="type"
              label="Típus *"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as ProjectType })}
              options={ALL_PROJECT_TYPES.map((t) => ({ value: t, label: PROJECT_TYPE_LABELS[t] }))}
              disabled={!canEdit}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="name"
                label="Név *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={errors.name}
                disabled={!canEdit}
              />
              <Input
                id="code"
                label="Kód *"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                error={errors.code}
                placeholder="pl. PROJ-001"
                disabled={!canEdit}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leírás</label>
              <textarea
                value={form.descriptionRich}
                onChange={(e) => setForm({ ...form, descriptionRich: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canEdit}
              />
            </div>
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardHeader><h2 className="text-lg font-semibold">Címkék</h2></CardHeader>
          <CardBody>
            <TagSelect
              items={tags}
              selectedIds={form.tagIds}
              onChange={(ids) => setForm({ ...form, tagIds: ids })}
              placeholder="Címkék keresése..."
            />
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardHeader><h2 className="text-lg font-semibold">Célok és KPI</h2></CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vállalati célok</label>
              <textarea
                value={form.goalsRich}
                onChange={(e) => setForm({ ...form, goalsRich: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canEdit}
              />
            </div>
            <FileUpload
              label="Célok csatolmányai"
              attachmentIds={form.goalsAttachmentIds}
              onChange={(ids) => setForm({ ...form, goalsAttachmentIds: ids })}
              disabled={!canEdit}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KPI-ok</label>
              <textarea
                value={form.kpiRich}
                onChange={(e) => setForm({ ...form, kpiRich: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!canEdit}
              />
            </div>
            <FileUpload
              label="KPI csatolmányai"
              attachmentIds={form.kpiAttachmentIds}
              onChange={(ids) => setForm({ ...form, kpiAttachmentIds: ids })}
              disabled={!canEdit}
            />
            <Input
              id="expectedSmartOutcome"
              label="Elvárt eredmény (SMART)"
              value={form.expectedSmartOutcome}
              onChange={(e) => setForm({ ...form, expectedSmartOutcome: e.target.value })}
              disabled={!canEdit}
            />
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Csapat</h2>
            {canEdit && (
              <Button type="button" size="sm" onClick={addTeamMember}>
                <PlusIcon className="h-4 w-4 mr-1" />
                Tag hozzáadása
              </Button>
            )}
          </CardHeader>
          <CardBody>
            {form.team.length === 0 ? (
              <p className="text-gray-500 text-sm">Nincs csapattag hozzárendelve</p>
            ) : (
              <div className="space-y-3">
                {form.team.map((member, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Select
                      value={member.userId}
                      onChange={(e) => updateTeamMember(member.userId, 'userId', e.target.value)}
                      options={users
                        .filter((u) => u.id === member.userId || !form.team.some((t) => t.userId === u.id))
                        .map((u) => ({ value: u.id, label: u.name }))}
                      className="flex-1"
                      disabled={!canEdit}
                    />
                    <Select
                      value={member.roleInProject}
                      onChange={(e) => updateTeamMember(member.userId, 'roleInProject', e.target.value)}
                      options={ALL_PROJECT_ROLES.map((r) => ({ value: r, label: PROJECT_ROLE_LABELS[r] }))}
                      className="w-40"
                      disabled={!canEdit}
                    />
                    {canEdit && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeTeamMember(member.userId)}>
                        <TrashIcon className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {canEdit && (
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => navigate('/projects')}>
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
