import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Peptide, PeptideVial, DoseProtocol, DoseLog } from '@/types';

interface PEPEtideDB extends DBSchema {
  peptides: {
    key: string;
    value: Peptide;
    indexes: { 'by-name': string };
  };
  vials: {
    key: string;
    value: PeptideVial;
    indexes: { 'by-peptide': string; 'by-active': number };
  };
  protocols: {
    key: string;
    value: DoseProtocol;
    indexes: { 'by-vial': string; 'by-active': number };
  };
  doseLogs: {
    key: string;
    value: DoseLog;
    indexes: { 'by-protocol': string; 'by-date': Date; 'by-status': string };
  };
}

let dbInstance: IDBPDatabase<PEPEtideDB> | null = null;

export async function getDB() {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<PEPEtideDB>('peptide-track-db', 1, {
    upgrade(db) {
      // Peptides store
      const peptideStore = db.createObjectStore('peptides', { keyPath: 'id' });
      peptideStore.createIndex('by-name', 'name');

      // Vials store
      const vialStore = db.createObjectStore('vials', { keyPath: 'id' });
      vialStore.createIndex('by-peptide', 'peptideId');
      vialStore.createIndex('by-active', 'isActive');

      // Protocols store
      const protocolStore = db.createObjectStore('protocols', { keyPath: 'id' });
      protocolStore.createIndex('by-vial', 'vialId');
      protocolStore.createIndex('by-active', 'isActive');

      // Dose logs store
      const doseLogStore = db.createObjectStore('doseLogs', { keyPath: 'id' });
      doseLogStore.createIndex('by-protocol', 'protocolId');
      doseLogStore.createIndex('by-date', 'scheduledDate');
      doseLogStore.createIndex('by-status', 'status');
    },
  });

  return dbInstance;
}

// Peptide operations
export async function addPeptide(peptide: Omit<Peptide, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDB();
  const id = crypto.randomUUID();
  const now = new Date();
  const newPeptide: Peptide = {
    ...peptide,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await db.add('peptides', newPeptide);
  return newPeptide;
}

export async function getPeptides() {
  const db = await getDB();
  return db.getAll('peptides');
}

export async function getPeptide(id: string) {
  const db = await getDB();
  return db.get('peptides', id);
}

export async function updatePeptide(id: string, updates: Partial<Peptide>) {
  const db = await getDB();
  const peptide = await db.get('peptides', id);
  if (!peptide) throw new Error('Peptide not found');
  const updated = { ...peptide, ...updates, updatedAt: new Date() };
  await db.put('peptides', updated);
  return updated;
}

export async function deletePeptide(id: string) {
  const db = await getDB();
  await db.delete('peptides', id);
}

// Vial operations
export async function addVial(vial: Omit<PeptideVial, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDB();
  const id = crypto.randomUUID();
  const now = new Date();

  // Calculate concentration if bacteriostatic water is provided
  let concentration: number | undefined;
  let concentrationUnit: string | undefined;

  if (vial.bacteriostaticWaterAdded && vial.bacteriostaticWaterAdded > 0) {
    const vialSizeInMg = vial.vialSizeUnit === 'mg' ? vial.vialSize : vial.vialSize / 1000;
    concentration = vialSizeInMg / vial.bacteriostaticWaterAdded;
    concentrationUnit = 'mg/mL';
  }

  const newVial: PeptideVial = {
    ...vial,
    id,
    concentration,
    concentrationUnit,
    createdAt: now,
    updatedAt: now,
  };
  await db.add('vials', newVial);
  return newVial;
}

export async function getVials() {
  const db = await getDB();
  return db.getAll('vials');
}

export async function getActiveVials() {
  const db = await getDB();
  // Get all vials and filter for active ones since isActive is stored as boolean
  const allVials = await db.getAll('vials');
  return allVials.filter(vial => vial.isActive === true);
}

export async function getVialsByPeptide(peptideId: string) {
  const db = await getDB();
  return db.getAllFromIndex('vials', 'by-peptide', peptideId);
}

export async function updateVial(id: string, updates: Partial<PeptideVial>) {
  const db = await getDB();
  const vial = await db.get('vials', id);
  if (!vial) throw new Error('Vial not found');

  // Recalculate concentration if relevant fields updated
  let concentration = vial.concentration;
  let concentrationUnit = vial.concentrationUnit;

  const updatedVial = { ...vial, ...updates };

  if (updatedVial.bacteriostaticWaterAdded && updatedVial.bacteriostaticWaterAdded > 0) {
    const vialSizeInMg = updatedVial.vialSizeUnit === 'mg'
      ? updatedVial.vialSize
      : updatedVial.vialSize / 1000;
    concentration = vialSizeInMg / updatedVial.bacteriostaticWaterAdded;
    concentrationUnit = 'mg/mL';
  }

  const updated = {
    ...updatedVial,
    concentration,
    concentrationUnit,
    updatedAt: new Date()
  };
  await db.put('vials', updated);
  return updated;
}

export async function deleteVial(id: string) {
  const db = await getDB();
  await db.delete('vials', id);
}

// Protocol operations
export async function addProtocol(protocol: Omit<DoseProtocol, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDB();
  const id = crypto.randomUUID();
  const now = new Date();
  const newProtocol: DoseProtocol = {
    ...protocol,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await db.add('protocols', newProtocol);
  return newProtocol;
}

export async function getProtocols() {
  const db = await getDB();
  return db.getAll('protocols');
}

export async function getActiveProtocols() {
  const db = await getDB();
  // Get all protocols and filter for active ones since isActive is stored as boolean
  const allProtocols = await db.getAll('protocols');
  return allProtocols.filter(protocol => protocol.isActive === true);
}

export async function updateProtocol(id: string, updates: Partial<DoseProtocol>) {
  const db = await getDB();
  const protocol = await db.get('protocols', id);
  if (!protocol) throw new Error('Protocol not found');
  const updated = { ...protocol, ...updates, updatedAt: new Date() };
  await db.put('protocols', updated);
  return updated;
}

export async function deleteProtocol(id: string) {
  const db = await getDB();
  await db.delete('protocols', id);
}

// Dose log operations
export async function addDoseLog(log: Omit<DoseLog, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDB();
  const id = crypto.randomUUID();
  const now = new Date();
  const newLog: DoseLog = {
    ...log,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await db.add('doseLogs', newLog);
  return newLog;
}

export async function getDoseLogs() {
  const db = await getDB();
  return db.getAll('doseLogs');
}

export async function getDoseLogsByProtocol(protocolId: string) {
  const db = await getDB();
  return db.getAllFromIndex('doseLogs', 'by-protocol', protocolId);
}

export async function getDoseLogsByDateRange(startDate: Date, endDate: Date) {
  const db = await getDB();
  const allLogs = await db.getAll('doseLogs');
  return allLogs.filter(log => {
    const logDate = new Date(log.scheduledDate);
    return logDate >= startDate && logDate <= endDate;
  });
}

export async function updateDoseLog(id: string, updates: Partial<DoseLog>) {
  const db = await getDB();
  const log = await db.get('doseLogs', id);
  if (!log) throw new Error('Dose log not found');
  const updated = { ...log, ...updates, updatedAt: new Date() };
  await db.put('doseLogs', updated);
  return updated;
}

export async function deleteDoseLog(id: string) {
  const db = await getDB();
  await db.delete('doseLogs', id);
}
