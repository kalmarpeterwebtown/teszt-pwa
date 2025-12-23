import { v4 as uuidv4 } from 'uuid';
import type { User, Competency, Project, Task, ProjectTag, TaskType, Priority, Status } from '../types';
import { 
  seedUsers, seedCompetencies, seedProjects, seedTasks,
  seedProjectTags, seedTaskTypes, seedPriorities, seedStatuses,
  getAllUsers, getAllCompetencies, getAllProjects,
  getAllProjectTags, getAllTaskTypes, getAllPriorities, getAllStatuses
} from './db';

const competencyData: Omit<Competency, 'id' | 'createdAt'>[] = [
  { name: 'JavaScript', category: 'Programozás' },
  { name: 'TypeScript', category: 'Programozás' },
  { name: 'React', category: 'Frontend' },
  { name: 'Angular', category: 'Frontend' },
  { name: 'Vue.js', category: 'Frontend' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'Python', category: 'Programozás' },
  { name: 'Java', category: 'Programozás' },
  { name: 'SQL', category: 'Adatbázis' },
  { name: 'MongoDB', category: 'Adatbázis' },
  { name: 'Docker', category: 'DevOps' },
  { name: 'Kubernetes', category: 'DevOps' },
  { name: 'AWS', category: 'Cloud' },
  { name: 'Azure', category: 'Cloud' },
  { name: 'Projektmenedzsment', category: 'Soft Skills' },
  { name: 'Agile/Scrum', category: 'Metodológia' },
  { name: 'Kommunikáció', category: 'Soft Skills' },
  { name: 'Csapatvezetés', category: 'Soft Skills' },
];

const projectTagData: Omit<ProjectTag, 'id' | 'createdAt'>[] = [
  { name: 'Frontend', category: 'Technológia' },
  { name: 'Backend', category: 'Technológia' },
  { name: 'Mobile', category: 'Technológia' },
  { name: 'DevOps', category: 'Technológia' },
  { name: 'Kritikus', category: 'Prioritás' },
  { name: 'Stratégiai', category: 'Üzleti' },
  { name: 'POC', category: 'Típus' },
  { name: 'MVP', category: 'Típus' },
  { name: 'Karbantartás', category: 'Típus' },
  { name: 'Új fejlesztés', category: 'Típus' },
];

const taskTypeData: Omit<TaskType, 'id' | 'createdAt'>[] = [
  { name: 'Feature', category: 'Fejlesztés' },
  { name: 'Bug', category: 'Fejlesztés' },
  { name: 'Technical Debt', category: 'Fejlesztés' },
  { name: 'Documentation', category: 'Dokumentáció' },
  { name: 'Testing', category: 'Minőségbiztosítás' },
  { name: 'Research', category: 'Tervezés' },
  { name: 'Design', category: 'Tervezés' },
  { name: 'Meeting', category: 'Adminisztráció' },
  { name: 'Review', category: 'Minőségbiztosítás' },
];

const priorityData: Omit<Priority, 'id' | 'createdAt'>[] = [
  { name: 'Azonnali', order: 1 },
  { name: 'Sürgős', order: 2 },
  { name: 'Általános', order: 3 },
];

const statusData: Omit<Status, 'id' | 'createdAt'>[] = [
  { name: 'New', order: 1 },
  { name: 'In progress', order: 2 },
  { name: 'Done', order: 3, isFinal: true },
  { name: 'Hold on', order: 4 },
  { name: 'Cancelled', order: 5, isFinal: true },
  { name: 'Postponed', order: 6 },
];

interface SeedResult {
  usersLoaded: number;
  competenciesLoaded: number;
  projectsLoaded: number;
  tasksLoaded: number;
  tagsLoaded: number;
  typesLoaded: number;
  prioritiesLoaded: number;
  statusesLoaded: number;
}

export async function loadSeedData(): Promise<SeedResult> {
  const result: SeedResult = {
    usersLoaded: 0,
    competenciesLoaded: 0,
    projectsLoaded: 0,
    tasksLoaded: 0,
    tagsLoaded: 0,
    typesLoaded: 0,
    prioritiesLoaded: 0,
    statusesLoaded: 0,
  };

  // Seed priorities
  const existingPriorities = await getAllPriorities();
  if (existingPriorities.length === 0) {
    const priorities: Priority[] = priorityData.map((p) => ({
      ...p,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    }));
    await seedPriorities(priorities);
    result.prioritiesLoaded = priorities.length;
  }

  // Seed statuses
  const existingStatuses = await getAllStatuses();
  if (existingStatuses.length === 0) {
    const statuses: Status[] = statusData.map((s) => ({
      ...s,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    }));
    await seedStatuses(statuses);
    result.statusesLoaded = statuses.length;
  }

  // Seed project tags
  const existingTags = await getAllProjectTags();
  if (existingTags.length === 0) {
    const tags: ProjectTag[] = projectTagData.map((t) => ({
      ...t,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    }));
    await seedProjectTags(tags);
    result.tagsLoaded = tags.length;
  }

  // Seed task types
  const existingTypes = await getAllTaskTypes();
  if (existingTypes.length === 0) {
    const types: TaskType[] = taskTypeData.map((t) => ({
      ...t,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    }));
    await seedTaskTypes(types);
    result.typesLoaded = types.length;
  }

  // Seed competencies
  const existingCompetencies = await getAllCompetencies();
  if (existingCompetencies.length === 0) {
    const competencies: Competency[] = competencyData.map((c) => ({
      ...c,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    }));
    await seedCompetencies(competencies);
    result.competenciesLoaded = competencies.length;
  }

  // Seed users
  const existingUsers = await getAllUsers();
  if (existingUsers.length === 0) {
    const allCompetencies = await getAllCompetencies();
    const compIds = allCompetencies.map((c) => c.id);

    const users: User[] = [
      {
        id: uuidv4(),
        name: 'Admin Béla',
        contacts: { email: 'admin@tms.local', phone: '+36 30 111 1111' },
        jobTitle: 'Rendszergazda',
        role: 'Admin',
        competencyIds: compIds.slice(0, 5),
        workSchedule: { workdayStart: '08:00', workdayEnd: '16:30', vacations: [] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: 'Nagy István',
        contacts: { email: 'nagy.istvan@tms.local', phone: '+36 30 222 2222' },
        jobTitle: 'Fejlesztési Osztályvezető',
        role: 'OsztalyVezeto',
        competencyIds: compIds.slice(0, 8),
        workSchedule: {
          workdayStart: '09:00',
          workdayEnd: '17:30',
          vacations: [{ id: uuidv4(), from: '2025-01-06', to: '2025-01-10', type: 'vacation', note: 'Téli szabadság' }],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: 'Kiss Katalin',
        contacts: { email: 'kiss.katalin@tms.local' },
        jobTitle: 'Frontend Csoportvezető',
        role: 'CsoportVezeto',
        competencyIds: compIds.slice(2, 6),
        workSchedule: { workdayStart: '08:30', workdayEnd: '17:00', vacations: [] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: 'Tóth Péter',
        contacts: { email: 'toth.peter@tms.local', phone: '+36 30 444 4444' },
        jobTitle: 'Senior Frontend Fejlesztő',
        role: 'Munkatars',
        competencyIds: compIds.slice(0, 4),
        workSchedule: { workdayStart: '09:00', workdayEnd: '17:30', vacations: [] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: 'Szabó Anna',
        contacts: { email: 'szabo.anna@tms.local' },
        jobTitle: 'Junior Fejlesztő',
        role: 'Munkatars',
        competencyIds: compIds.slice(0, 2),
        workSchedule: {
          workdayStart: '08:00',
          workdayEnd: '16:30',
          vacations: [{ id: uuidv4(), from: '2025-02-01', to: '2025-02-03', type: 'sick', note: 'Betegség' }],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: 'Kovács Gábor',
        contacts: { email: 'kovacs.gabor@tms.local' },
        jobTitle: 'Projekt Megfigyelő',
        role: 'Megtekinto',
        competencyIds: [],
        workSchedule: { workdayStart: '09:00', workdayEnd: '17:00', vacations: [] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    await seedUsers(users);
    result.usersLoaded = users.length;
  }

  // Seed projects and tasks
  const existingProjects = await getAllProjects();
  if (existingProjects.length === 0) {
    const allUsers = await getAllUsers();
    const allTags = await getAllProjectTags();
    const allTypes = await getAllTaskTypes();
    const allPriorities = await getAllPriorities();
    const allStatuses = await getAllStatuses();

    const adminUser = allUsers.find(u => u.role === 'Admin');
    const osztalyVezeto = allUsers.find(u => u.role === 'OsztalyVezeto');
    const csoportVezeto = allUsers.find(u => u.role === 'CsoportVezeto');
    const munkatars1 = allUsers.find(u => u.role === 'Munkatars' && u.name.includes('Tóth'));
    const munkatars2 = allUsers.find(u => u.role === 'Munkatars' && u.name.includes('Szabó'));
    const megtekinto = allUsers.find(u => u.role === 'Megtekinto');

    const featureType = allTypes.find(t => t.name === 'Feature');
    const bugType = allTypes.find(t => t.name === 'Bug');
    const docType = allTypes.find(t => t.name === 'Documentation');

    const azonnal = allPriorities.find(p => p.name === 'Azonnali');
    const surgos = allPriorities.find(p => p.name === 'Sürgős');
    const altalanos = allPriorities.find(p => p.name === 'Általános');

    const newStatus = allStatuses.find(s => s.name === 'New');
    const inProgress = allStatuses.find(s => s.name === 'In progress');
    const done = allStatuses.find(s => s.name === 'Done');

    const frontendTag = allTags.find(t => t.name === 'Frontend');
    const backendTag = allTags.find(t => t.name === 'Backend');
    const strategiaiTag = allTags.find(t => t.name === 'Stratégiai');
    const mvpTag = allTags.find(t => t.name === 'MVP');
    const karbantartasTag = allTags.find(t => t.name === 'Karbantartás');

    // Project 1: Development
    const project1Id = uuidv4();
    const project1: Project = {
      id: project1Id,
      type: 'DEVELOPMENT',
      name: 'TMS Rendszer Fejlesztés',
      code: 'TMS-DEV',
      descriptionRich: '<p>A TMS rendszer fejlesztési projektje, amely magában foglalja az összes új funkció implementálását.</p>',
      goalsRich: '<p>Célok:<br/>- Felhasználókezelés<br/>- Projektkezelés<br/>- Feladatkezelés</p>',
      goalsAttachmentIds: [],
      kpiRich: '<p>KPI-ok: 90% teszt lefedettség, 2 hetes sprint ciklusok</p>',
      kpiAttachmentIds: [],
      expectedSmartOutcome: 'Működő TMS rendszer 2025 Q2-re',
      tagIds: [frontendTag?.id, backendTag?.id, strategiaiTag?.id].filter(Boolean) as string[],
      team: [
        { userId: osztalyVezeto!.id, roleInProject: 'LEAD' },
        { userId: csoportVezeto!.id, roleInProject: 'MEMBER' },
        { userId: munkatars1!.id, roleInProject: 'MEMBER' },
        { userId: munkatars2!.id, roleInProject: 'MEMBER' },
        { userId: megtekinto!.id, roleInProject: 'VIEWER' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Project 2: Customer
    const project2Id = uuidv4();
    const project2: Project = {
      id: project2Id,
      type: 'CUSTOMER',
      name: 'ABC Kft. Webshop',
      code: 'ABC-WEB',
      descriptionRich: '<p>ABC Kft. részére készülő e-commerce webáruház fejlesztése.</p>',
      goalsRich: '<p>Online értékesítési platform létrehozása</p>',
      goalsAttachmentIds: [],
      kpiAttachmentIds: [],
      expectedSmartOutcome: 'Éles indulás 2025 márciusban',
      tagIds: [frontendTag?.id, mvpTag?.id].filter(Boolean) as string[],
      team: [
        { userId: csoportVezeto!.id, roleInProject: 'LEAD' },
        { userId: munkatars1!.id, roleInProject: 'MEMBER' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Project 3: Production Support
    const project3Id = uuidv4();
    const project3: Project = {
      id: project3Id,
      type: 'PRODUCTION_SUPPORT',
      name: 'Legacy Rendszer Karbantartás',
      code: 'LEGACY-SUP',
      descriptionRich: '<p>Meglévő legacy rendszerek karbantartása és hibajavítása.</p>',
      goalsAttachmentIds: [],
      kpiAttachmentIds: [],
      expectedSmartOutcome: 'Stabil működés, max 4 óra reakcióidő',
      tagIds: [backendTag?.id, karbantartasTag?.id].filter(Boolean) as string[],
      team: [
        { userId: adminUser!.id, roleInProject: 'LEAD' },
        { userId: munkatars2!.id, roleInProject: 'MEMBER' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await seedProjects([project1, project2, project3]);
    result.projectsLoaded = 3;

    // Tasks for Project 1
    const task1Id = uuidv4();
    const task1: Task = {
      id: task1Id,
      projectId: project1Id,
      typeId: featureType!.id,
      name: 'Felhasználó lista oldal',
      code: 'TMS-001',
      descriptionRich: '<p>Felhasználók listázása szűréssel és kereséssel.</p>',
      descriptionAttachmentIds: [],
      assigneeUserIds: [munkatars1!.id],
      dueDateTime: '2025-01-15T17:00:00.000Z',
      priorityId: surgos!.id,
      statusId: done!.id,
      estimatedHours: 16,
      actualHours: 14,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const task2Id = uuidv4();
    const task2: Task = {
      id: task2Id,
      projectId: project1Id,
      typeId: featureType!.id,
      name: 'Projekt kezelés modul',
      code: 'TMS-002',
      descriptionRich: '<p>Projektek létrehozása, szerkesztése, törlése.</p>',
      descriptionAttachmentIds: [],
      assigneeUserIds: [munkatars1!.id, munkatars2!.id],
      dueDateTime: '2025-02-01T17:00:00.000Z',
      priorityId: azonnal!.id,
      statusId: inProgress!.id,
      estimatedHours: 40,
      actualHours: 12,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Subtask for task2
    const subtask1: Task = {
      id: uuidv4(),
      projectId: project1Id,
      parentTaskId: task2Id,
      typeId: featureType!.id,
      name: 'Projekt lista nézet',
      code: 'TMS-002-1',
      descriptionAttachmentIds: [],
      assigneeUserIds: [munkatars1!.id],
      dueDateTime: '2025-01-20T17:00:00.000Z',
      priorityId: surgos!.id,
      statusId: inProgress!.id,
      estimatedHours: 8,
      actualHours: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const subtask2: Task = {
      id: uuidv4(),
      projectId: project1Id,
      parentTaskId: task2Id,
      typeId: featureType!.id,
      name: 'Projekt űrlap',
      code: 'TMS-002-2',
      descriptionAttachmentIds: [],
      assigneeUserIds: [munkatars2!.id],
      dueDateTime: '2025-01-25T17:00:00.000Z',
      priorityId: altalanos!.id,
      statusId: newStatus!.id,
      estimatedHours: 12,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const task3: Task = {
      id: uuidv4(),
      projectId: project1Id,
      typeId: docType!.id,
      name: 'API dokumentáció',
      code: 'TMS-003',
      descriptionAttachmentIds: [],
      assigneeUserIds: [csoportVezeto!.id],
      priorityId: altalanos!.id,
      statusId: newStatus!.id,
      estimatedHours: 8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Tasks for Project 2
    const task4: Task = {
      id: uuidv4(),
      projectId: project2Id,
      typeId: featureType!.id,
      name: 'Termék katalógus',
      code: 'ABC-001',
      descriptionAttachmentIds: [],
      assigneeUserIds: [munkatars1!.id],
      dueDateTime: '2025-02-15T17:00:00.000Z',
      priorityId: surgos!.id,
      statusId: inProgress!.id,
      estimatedHours: 24,
      actualHours: 8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Tasks for Project 3
    const task5: Task = {
      id: uuidv4(),
      projectId: project3Id,
      typeId: bugType!.id,
      name: 'Login hiba javítás',
      code: 'LEG-001',
      descriptionRich: '<p>Időszakos bejelentkezési hiba javítása.</p>',
      descriptionAttachmentIds: [],
      assigneeUserIds: [munkatars2!.id],
      dueDateTime: '2025-01-10T12:00:00.000Z',
      priorityId: azonnal!.id,
      statusId: done!.id,
      estimatedHours: 4,
      actualHours: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await seedTasks([task1, task2, subtask1, subtask2, task3, task4, task5]);
    result.tasksLoaded = 7;
  }

  return result;
}
