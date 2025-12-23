import type { DBSchema, IDBPDatabase } from 'idb';
import { openDB } from 'idb';
import type { 
  User, Competency, Project, Task, 
  ProjectTag, TaskType, Priority, Status, Attachment 
} from '../types';

interface AttachmentWithData extends Attachment {
  data: Blob;
}

interface TMSDatabase extends DBSchema {
  users: {
    key: string;
    value: User;
    indexes: { 'by-name': string; 'by-role': string };
  };
  competencies: {
    key: string;
    value: Competency;
    indexes: { 'by-name': string };
  };
  projects: {
    key: string;
    value: Project;
    indexes: { 'by-code': string; 'by-type': string };
  };
  tasks: {
    key: string;
    value: Task;
    indexes: { 'by-project': string; 'by-parent': string; 'by-code': string };
  };
  projectTags: {
    key: string;
    value: ProjectTag;
    indexes: { 'by-name': string };
  };
  taskTypes: {
    key: string;
    value: TaskType;
    indexes: { 'by-name': string };
  };
  priorities: {
    key: string;
    value: Priority;
    indexes: { 'by-order': number };
  };
  statuses: {
    key: string;
    value: Status;
    indexes: { 'by-order': number };
  };
  attachments: {
    key: string;
    value: AttachmentWithData;
  };
}

const DB_NAME = 'tms-database';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<TMSDatabase> | null = null;

export async function getDB(): Promise<IDBPDatabase<TMSDatabase>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<TMSDatabase>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // V1 stores
      if (oldVersion < 1) {
        const userStore = db.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('by-name', 'name');
        userStore.createIndex('by-role', 'role');

        const compStore = db.createObjectStore('competencies', { keyPath: 'id' });
        compStore.createIndex('by-name', 'name');
      }

      // V2 stores
      if (oldVersion < 2) {
        const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
        projectStore.createIndex('by-code', 'code', { unique: true });
        projectStore.createIndex('by-type', 'type');

        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('by-project', 'projectId');
        taskStore.createIndex('by-parent', 'parentTaskId');
        taskStore.createIndex('by-code', 'code');

        const tagStore = db.createObjectStore('projectTags', { keyPath: 'id' });
        tagStore.createIndex('by-name', 'name');

        const typeStore = db.createObjectStore('taskTypes', { keyPath: 'id' });
        typeStore.createIndex('by-name', 'name');

        const priorityStore = db.createObjectStore('priorities', { keyPath: 'id' });
        priorityStore.createIndex('by-order', 'order');

        const statusStore = db.createObjectStore('statuses', { keyPath: 'id' });
        statusStore.createIndex('by-order', 'order');

        db.createObjectStore('attachments', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

// User operations
export async function getAllUsers(): Promise<User[]> {
  const db = await getDB();
  return db.getAll('users');
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = await getDB();
  return db.get('users', id);
}

export async function createUser(user: User): Promise<void> {
  const db = await getDB();
  await db.put('users', user);
}

export async function updateUser(user: User): Promise<void> {
  const db = await getDB();
  await db.put('users', { ...user, updatedAt: new Date().toISOString() });
}

export async function deleteUser(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('users', id);
}

// Competency operations
export async function getAllCompetencies(): Promise<Competency[]> {
  const db = await getDB();
  return db.getAll('competencies');
}

export async function getCompetencyById(id: string): Promise<Competency | undefined> {
  const db = await getDB();
  return db.get('competencies', id);
}

export async function createCompetency(competency: Competency): Promise<void> {
  const db = await getDB();
  await db.put('competencies', competency);
}

export async function updateCompetency(competency: Competency): Promise<void> {
  const db = await getDB();
  await db.put('competencies', competency);
}

export async function deleteCompetency(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('competencies', id);
}

// Project operations
export async function getAllProjects(): Promise<Project[]> {
  const db = await getDB();
  return db.getAll('projects');
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.get('projects', id);
}

export async function getProjectByCode(code: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.getFromIndex('projects', 'by-code', code);
}

export async function createProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.put('projects', project);
}

export async function updateProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.put('projects', { ...project, updatedAt: new Date().toISOString() });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  // Delete all tasks for this project
  const tasks = await getTasksByProject(id);
  const tx = db.transaction(['projects', 'tasks'], 'readwrite');
  await Promise.all([
    ...tasks.map(t => tx.objectStore('tasks').delete(t.id)),
    tx.objectStore('projects').delete(id),
    tx.done
  ]);
}

// Task operations
export async function getAllTasks(): Promise<Task[]> {
  const db = await getDB();
  return db.getAll('tasks');
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  const db = await getDB();
  return db.get('tasks', id);
}

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const db = await getDB();
  return db.getAllFromIndex('tasks', 'by-project', projectId);
}

export async function getSubtasks(parentTaskId: string): Promise<Task[]> {
  const db = await getDB();
  return db.getAllFromIndex('tasks', 'by-parent', parentTaskId);
}

export async function createTask(task: Task): Promise<void> {
  const db = await getDB();
  await db.put('tasks', task);
}

export async function updateTask(task: Task): Promise<void> {
  const db = await getDB();
  await db.put('tasks', { ...task, updatedAt: new Date().toISOString() });
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDB();
  // Delete subtasks first
  const subtasks = await getSubtasks(id);
  const tx = db.transaction('tasks', 'readwrite');
  await Promise.all([
    ...subtasks.map(t => tx.store.delete(t.id)),
    tx.store.delete(id),
    tx.done
  ]);
}

// Project Tag operations
export async function getAllProjectTags(): Promise<ProjectTag[]> {
  const db = await getDB();
  return db.getAll('projectTags');
}

export async function getProjectTagById(id: string): Promise<ProjectTag | undefined> {
  const db = await getDB();
  return db.get('projectTags', id);
}

export async function createProjectTag(tag: ProjectTag): Promise<void> {
  const db = await getDB();
  await db.put('projectTags', tag);
}

export async function updateProjectTag(tag: ProjectTag): Promise<void> {
  const db = await getDB();
  await db.put('projectTags', tag);
}

export async function deleteProjectTag(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('projectTags', id);
}

// Task Type operations
export async function getAllTaskTypes(): Promise<TaskType[]> {
  const db = await getDB();
  return db.getAll('taskTypes');
}

export async function getTaskTypeById(id: string): Promise<TaskType | undefined> {
  const db = await getDB();
  return db.get('taskTypes', id);
}

export async function createTaskType(taskType: TaskType): Promise<void> {
  const db = await getDB();
  await db.put('taskTypes', taskType);
}

export async function updateTaskType(taskType: TaskType): Promise<void> {
  const db = await getDB();
  await db.put('taskTypes', taskType);
}

export async function deleteTaskType(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('taskTypes', id);
}

// Priority operations
export async function getAllPriorities(): Promise<Priority[]> {
  const db = await getDB();
  const all = await db.getAll('priorities');
  return all.sort((a, b) => a.order - b.order);
}

export async function getPriorityById(id: string): Promise<Priority | undefined> {
  const db = await getDB();
  return db.get('priorities', id);
}

export async function createPriority(priority: Priority): Promise<void> {
  const db = await getDB();
  await db.put('priorities', priority);
}

export async function updatePriority(priority: Priority): Promise<void> {
  const db = await getDB();
  await db.put('priorities', priority);
}

export async function deletePriority(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('priorities', id);
}

// Status operations
export async function getAllStatuses(): Promise<Status[]> {
  const db = await getDB();
  const all = await db.getAll('statuses');
  return all.sort((a, b) => a.order - b.order);
}

export async function getStatusById(id: string): Promise<Status | undefined> {
  const db = await getDB();
  return db.get('statuses', id);
}

export async function createStatus(status: Status): Promise<void> {
  const db = await getDB();
  await db.put('statuses', status);
}

export async function updateStatus(status: Status): Promise<void> {
  const db = await getDB();
  await db.put('statuses', status);
}

export async function deleteStatus(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('statuses', id);
}

// Attachment operations
export async function getAttachmentById(id: string): Promise<AttachmentWithData | undefined> {
  const db = await getDB();
  return db.get('attachments', id);
}

export async function getAttachmentMeta(id: string): Promise<Attachment | undefined> {
  const attachment = await getAttachmentById(id);
  if (!attachment) return undefined;
  const { data: _, ...meta } = attachment;
  return meta;
}

export async function createAttachment(file: File): Promise<Attachment> {
  const db = await getDB();
  const id = crypto.randomUUID();
  const attachment: AttachmentWithData = {
    id,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    createdAt: new Date().toISOString(),
    data: file,
  };
  await db.put('attachments', attachment);
  const { data: _, ...meta } = attachment;
  return meta;
}

export async function deleteAttachment(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('attachments', id);
}

export async function downloadAttachment(id: string): Promise<void> {
  const attachment = await getAttachmentById(id);
  if (!attachment) return;
  
  const url = URL.createObjectURL(attachment.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = attachment.fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Bulk operations for seeding
export async function seedUsers(users: User[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('users', 'readwrite');
  await Promise.all([...users.map((u) => tx.store.put(u)), tx.done]);
}

export async function seedCompetencies(competencies: Competency[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('competencies', 'readwrite');
  await Promise.all([...competencies.map((c) => tx.store.put(c)), tx.done]);
}

export async function seedProjects(projects: Project[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('projects', 'readwrite');
  await Promise.all([...projects.map((p) => tx.store.put(p)), tx.done]);
}

export async function seedTasks(tasks: Task[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('tasks', 'readwrite');
  await Promise.all([...tasks.map((t) => tx.store.put(t)), tx.done]);
}

export async function seedProjectTags(tags: ProjectTag[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('projectTags', 'readwrite');
  await Promise.all([...tags.map((t) => tx.store.put(t)), tx.done]);
}

export async function seedTaskTypes(types: TaskType[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('taskTypes', 'readwrite');
  await Promise.all([...types.map((t) => tx.store.put(t)), tx.done]);
}

export async function seedPriorities(priorities: Priority[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('priorities', 'readwrite');
  await Promise.all([...priorities.map((p) => tx.store.put(p)), tx.done]);
}

export async function seedStatuses(statuses: Status[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('statuses', 'readwrite');
  await Promise.all([...statuses.map((s) => tx.store.put(s)), tx.done]);
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await Promise.all([
    db.clear('users'),
    db.clear('competencies'),
    db.clear('projects'),
    db.clear('tasks'),
    db.clear('projectTags'),
    db.clear('taskTypes'),
    db.clear('priorities'),
    db.clear('statuses'),
    db.clear('attachments'),
  ]);
}
