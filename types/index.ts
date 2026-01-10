export interface Peptide {
  id: string;
  name: string;
  description?: string;
  commonDosageRange?: {
    min: number;
    max: number;
    unit: 'mcg' | 'mg';
  };
  benefits?: string[];
  contraindications?: string[];
  warnings?: string[];
  canMixWith?: string[]; // IDs of peptides that can be safely mixed
  cannotMixWith?: string[]; // IDs of peptides that should NOT be mixed
  storageInstructions?: string;
  shelfLife?: {
    unreconstituted: string;
    reconstituted: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PeptideVial {
  id: string;
  peptideId: string;
  peptideName: string;
  vialSize: number; // in mg
  vialSizeUnit: 'mg' | 'mcg';
  bacteriostaticWaterAdded?: number; // in mL
  concentration?: number; // calculated: vialSize / bacteriostaticWaterAdded
  concentrationUnit?: string; // e.g., "mg/mL" or "mcg/mL"
  receivedDate: Date;
  reconstitutedDate?: Date;
  expirationDate?: Date;
  batchNumber?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoseProtocol {
  id: string;
  vialId: string;
  peptideId: string;
  peptideName: string;
  targetDose: number; // in mcg or mg
  targetDoseUnit: 'mcg' | 'mg';
  volumePerDose?: number; // calculated in mL
  frequency: 'daily' | 'every-other-day' | 'weekly' | 'custom';
  customFrequencyDays?: number[]; // [0,1,2,3,4,5,6] for custom schedules
  startDate: Date;
  endDate?: Date;
  timeOfDay?: string; // e.g., "morning", "evening", "before bed"
  specificTime?: string; // e.g., "08:00", "22:00"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoseLog {
  id: string;
  protocolId: string;
  vialId: string;
  peptideId: string;
  peptideName: string;
  scheduledDate: Date;
  actualDate?: Date;
  targetDose: number;
  actualDose?: number;
  doseUnit: 'mcg' | 'mg';
  volumeInjected?: number; // in mL
  injectionSite?: string;
  status: 'pending' | 'taken' | 'skipped';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReconstitutionCalculation {
  vialSize: number;
  vialSizeUnit: 'mg' | 'mcg';
  bacteriostaticWater: number; // mL
  targetDose: number;
  targetDoseUnit: 'mcg' | 'mg';
  concentration: number;
  concentrationUnit: string;
  volumePerDose: number; // mL
  unitsOnSyringe: number; // for U-100 insulin syringe
  totalDoses: number;
}

export interface SafetyCheck {
  type: 'interaction' | 'contraindication' | 'dosage' | 'expiration';
  severity: 'info' | 'warning' | 'danger';
  message: string;
  peptideIds?: string[];
}

export type ViewMode = 'dashboard' | 'add-stack' | 'my-list' | 'calculator' | 'calendar' | 'protocol' | 'community' | 'settings';
