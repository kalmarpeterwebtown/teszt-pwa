import { v4 as uuidv4 } from 'uuid';
import type { User, Competency } from '../types';
import { seedUsers, seedCompetencies, getAllUsers, getAllCompetencies } from './db';

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

export async function loadSeedData(): Promise<{ usersLoaded: number; competenciesLoaded: number }> {
  const existingUsers = await getAllUsers();
  const existingCompetencies = await getAllCompetencies();

  let competenciesLoaded = 0;
  let usersLoaded = 0;

  if (existingCompetencies.length === 0) {
    const competencies: Competency[] = competencyData.map((c) => ({
      ...c,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    }));
    await seedCompetencies(competencies);
    competenciesLoaded = competencies.length;
  }

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
        workSchedule: {
          workdayStart: '08:00',
          workdayEnd: '16:30',
          vacations: [],
        },
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
          vacations: [
            {
              id: uuidv4(),
              from: '2025-01-06',
              to: '2025-01-10',
              type: 'vacation',
              note: 'Téli szabadság',
            },
          ],
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
        workSchedule: {
          workdayStart: '08:30',
          workdayEnd: '17:00',
          vacations: [],
        },
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
        workSchedule: {
          workdayStart: '09:00',
          workdayEnd: '17:30',
          vacations: [],
        },
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
          vacations: [
            {
              id: uuidv4(),
              from: '2025-02-01',
              to: '2025-02-03',
              type: 'sick',
              note: 'Betegség',
            },
          ],
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
        workSchedule: {
          workdayStart: '09:00',
          workdayEnd: '17:00',
          vacations: [],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    await seedUsers(users);
    usersLoaded = users.length;
  }

  return { usersLoaded, competenciesLoaded };
}
