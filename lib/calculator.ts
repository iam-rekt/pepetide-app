import type { ReconstitutionCalculation } from '@/types';

export function calculateReconstitution(
  vialSize: number,
  vialSizeUnit: 'mg' | 'mcg',
  bacteriostaticWater: number,
  targetDose: number,
  targetDoseUnit: 'mcg' | 'mg'
): ReconstitutionCalculation {
  // Convert everything to mcg for consistency
  const vialSizeInMcg = vialSizeUnit === 'mg' ? vialSize * 1000 : vialSize;
  const targetDoseInMcg = targetDoseUnit === 'mg' ? targetDose * 1000 : targetDose;

  // Calculate concentration in mcg/mL
  const concentrationMcgPerMl = vialSizeInMcg / bacteriostaticWater;

  // Calculate concentration in mg/mL for display
  const concentrationMgPerMl = concentrationMcgPerMl / 1000;

  // Calculate volume needed per dose (in mL)
  const volumePerDose = targetDoseInMcg / concentrationMcgPerMl;

  // Calculate units on U-100 insulin syringe (1 unit = 0.01mL)
  const unitsOnSyringe = volumePerDose * 100;

  // Calculate total number of doses in vial
  const totalDoses = Math.floor(vialSizeInMcg / targetDoseInMcg);

  return {
    vialSize,
    vialSizeUnit,
    bacteriostaticWater,
    targetDose,
    targetDoseUnit,
    concentration: concentrationMgPerMl,
    concentrationUnit: 'mg/mL',
    volumePerDose: parseFloat(volumePerDose.toFixed(4)),
    unitsOnSyringe: parseFloat(unitsOnSyringe.toFixed(2)),
    totalDoses,
  };
}

export function formatDosage(amount: number, unit: 'mcg' | 'mg'): string {
  return `${amount.toLocaleString()} ${unit}`;
}

export function formatVolume(mL: number): string {
  return `${mL.toFixed(3)} mL`;
}

export function formatConcentration(concentration: number, unit: string): string {
  return `${concentration.toFixed(2)} ${unit}`;
}

export function convertDosage(
  amount: number,
  fromUnit: 'mcg' | 'mg',
  toUnit: 'mcg' | 'mg'
): number {
  if (fromUnit === toUnit) return amount;
  if (fromUnit === 'mg' && toUnit === 'mcg') return amount * 1000;
  if (fromUnit === 'mcg' && toUnit === 'mg') return amount / 1000;
  return amount;
}

// Calculate expiration date based on reconstitution date
export function calculateExpirationDate(
  reconstitutedDate: Date,
  shelfLifeWeeks: number = 6
): Date {
  const expiration = new Date(reconstitutedDate);
  expiration.setDate(expiration.getDate() + (shelfLifeWeeks * 7));
  return expiration;
}

// Check if vial is expired
export function isVialExpired(expirationDate: Date): boolean {
  return new Date() > expirationDate;
}

// Check if vial is expiring soon (within 7 days)
export function isVialExpiringSoon(expirationDate: Date): boolean {
  const now = new Date();
  const daysUntilExpiration = Math.floor(
    (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiration <= 7 && daysUntilExpiration >= 0;
}

// Get recommended bacteriostatic water amount for easier calculations
export function getRecommendedBacteriostaticWater(
  vialSize: number,
  vialSizeUnit: 'mg' | 'mcg'
): number[] {
  const vialSizeInMg = vialSizeUnit === 'mg' ? vialSize : vialSize / 1000;

  // Common recommendations for easier math
  const recommendations: number[] = [];

  // 1mg/mL concentration
  recommendations.push(vialSizeInMg);

  // 2mg/mL concentration (half the water)
  if (vialSizeInMg >= 2) {
    recommendations.push(vialSizeInMg / 2);
  }

  // 2.5mg/mL concentration
  if (vialSizeInMg >= 2.5) {
    recommendations.push(vialSizeInMg / 2.5);
  }

  // Round to 1 decimal place
  return recommendations.map(r => parseFloat(r.toFixed(1))).filter((v, i, a) => a.indexOf(v) === i);
}
