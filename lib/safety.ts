import type { Peptide, PeptideVial, DoseLog, SafetyCheck } from '@/types';
import { isVialExpired, isVialExpiringSoon } from './calculator';

export function checkPeptideInteractions(
  activePeptides: Peptide[]
): SafetyCheck[] {
  const checks: SafetyCheck[] = [];

  // Check for mixing incompatibilities
  for (let i = 0; i < activePeptides.length; i++) {
    for (let j = i + 1; j < activePeptides.length; j++) {
      const peptide1 = activePeptides[i];
      const peptide2 = activePeptides[j];

      // Check if peptide1 cannot be mixed with peptide2
      if (peptide1.cannotMixWith?.includes(peptide2.id)) {
        checks.push({
          type: 'interaction',
          severity: 'danger',
          message: `${peptide1.name} should NOT be mixed with ${peptide2.name}. Administer separately.`,
          peptideIds: [peptide1.id, peptide2.id],
        });
      }

      // Check for redundant mechanisms (e.g., two GHRH peptides)
      if (peptide1.contraindications && peptide2.name) {
        const hasRedundantWarning = peptide1.contraindications.some(c =>
          c.toLowerCase().includes(peptide2.name.toLowerCase())
        );
        if (hasRedundantWarning) {
          checks.push({
            type: 'interaction',
            severity: 'warning',
            message: `${peptide1.name} and ${peptide2.name} may have redundant mechanisms. Consider using only one.`,
            peptideIds: [peptide1.id, peptide2.id],
          });
        }
      }
    }
  }

  return checks;
}

export function checkDosageRange(
  peptide: Peptide,
  dose: number,
  doseUnit: 'mcg' | 'mg'
): SafetyCheck[] {
  const checks: SafetyCheck[] = [];

  if (!peptide.commonDosageRange) return checks;

  // Convert dose to same unit as range
  let doseInRangeUnit = dose;
  if (doseUnit !== peptide.commonDosageRange.unit) {
    doseInRangeUnit = doseUnit === 'mg'
      ? dose * 1000  // mg to mcg
      : dose / 1000; // mcg to mg
  }

  if (doseInRangeUnit < peptide.commonDosageRange.min) {
    checks.push({
      type: 'dosage',
      severity: 'info',
      message: `${peptide.name}: Dose (${dose}${doseUnit}) is below common range (${peptide.commonDosageRange.min}-${peptide.commonDosageRange.max}${peptide.commonDosageRange.unit}).`,
      peptideIds: [peptide.id],
    });
  } else if (doseInRangeUnit > peptide.commonDosageRange.max) {
    checks.push({
      type: 'dosage',
      severity: 'warning',
      message: `${peptide.name}: Dose (${dose}${doseUnit}) exceeds common range (${peptide.commonDosageRange.min}-${peptide.commonDosageRange.max}${peptide.commonDosageRange.unit}). Verify with healthcare provider.`,
      peptideIds: [peptide.id],
    });
  }

  return checks;
}

export function checkVialExpiration(vials: PeptideVial[]): SafetyCheck[] {
  const checks: SafetyCheck[] = [];

  vials.forEach(vial => {
    if (!vial.expirationDate) return;

    if (isVialExpired(vial.expirationDate)) {
      checks.push({
        type: 'expiration',
        severity: 'danger',
        message: `${vial.peptideName} vial (${vial.vialSize}${vial.vialSizeUnit}) has expired. Do not use.`,
      });
    } else if (isVialExpiringSoon(vial.expirationDate)) {
      const daysLeft = Math.floor(
        (vial.expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      checks.push({
        type: 'expiration',
        severity: 'warning',
        message: `${vial.peptideName} vial (${vial.vialSize}${vial.vialSizeUnit}) expires in ${daysLeft} days.`,
      });
    }
  });

  return checks;
}

export function checkDoubleDose(
  todayLogs: DoseLog[],
  peptideId: string
): SafetyCheck | null {
  const takenToday = todayLogs.filter(
    log => log.peptideId === peptideId && log.status === 'taken'
  );

  if (takenToday.length > 0) {
    return {
      type: 'interaction',
      severity: 'warning',
      message: `You've already logged a dose of this peptide today. Verify if additional dose is intended.`,
      peptideIds: [peptideId],
    };
  }

  return null;
}

export function checkMissedDoses(doseLogs: DoseLog[]): SafetyCheck[] {
  const checks: SafetyCheck[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const missedLogs = doseLogs.filter(log => {
    const scheduleDate = new Date(log.scheduledDate);
    scheduleDate.setHours(0, 0, 0, 0);
    return scheduleDate < now && log.status === 'pending';
  });

  if (missedLogs.length > 0) {
    // Group by peptide
    const byPeptide = missedLogs.reduce((acc, log) => {
      if (!acc[log.peptideName]) acc[log.peptideName] = 0;
      acc[log.peptideName]++;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(byPeptide).forEach(([name, count]) => {
      checks.push({
        type: 'interaction',
        severity: 'info',
        message: `${count} missed dose${count > 1 ? 's' : ''} of ${name}.`,
      });
    });
  }

  return checks;
}

export function getAllSafetyChecks(
  activePeptides: Peptide[],
  activeVials: PeptideVial[],
  recentLogs: DoseLog[]
): SafetyCheck[] {
  return [
    ...checkPeptideInteractions(activePeptides),
    ...checkVialExpiration(activeVials),
    ...checkMissedDoses(recentLogs),
  ];
}
