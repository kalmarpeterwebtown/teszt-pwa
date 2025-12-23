import type { DBSchema, IDBPDatabase } from 'idb';
import { openDB } from 'idb';
import type { User, Competency } from '../types';

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
}

const DB_NAME = 'tms-database';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<TMSDatabase> | null = null;

export async function getDB(): Promise<IDBPDatabase<TMSDatabase>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<TMSDatabase>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('by-name', 'name');
        userStore.createIndex('by-role', 'role');
      }
      if (!db.objectStoreNames.contains('competencies')) {
        const compStore = db.createObjectStore('competencies', { keyPath: 'id' });
        compStore.createIndex('by-name', 'name');
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

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('users');
  await db.clear('competencies');
}
