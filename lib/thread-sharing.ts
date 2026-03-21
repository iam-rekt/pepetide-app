import type { DoseLog, DoseProtocol, StackPeptideInfo } from '@/types';

export interface PreparedThreadComposerData {
  title: string;
  content: string;
  tags: string[];
  stackPeptides: StackPeptideInfo[];
  sourceLabel?: string;
  templateKind?: 'stack' | 'question' | 'update';
}

function formatProtocolFrequency(frequency: DoseProtocol['frequency']) {
  if (frequency === 'every-other-day') return 'every other day';
  return frequency;
}

function formatProtocolDuration(endDate?: Date) {
  if (!endDate) return 'Ongoing';
  return `Until ${new Date(endDate).toLocaleDateString()}`;
}

export function buildStackPeptidesFromProtocols(protocols: DoseProtocol[]): StackPeptideInfo[] {
  return protocols.map((protocol) => ({
    peptideName: protocol.peptideName,
    dosage: protocol.targetDose,
    dosageUnit: protocol.targetDoseUnit,
    frequency: formatProtocolFrequency(protocol.frequency),
    timeOfDay: protocol.timeOfDay || protocol.specificTime || '',
    duration: formatProtocolDuration(protocol.endDate),
    notes: '',
  }));
}

export function buildThreadDraftFromStackPeptides(
  stackPeptides: StackPeptideInfo[],
  intro = 'Sharing my current tracked stack.'
): PreparedThreadComposerData {
  const peptideNames = stackPeptides.map((peptide) => peptide.peptideName);
  const title =
    peptideNames.length === 0
      ? 'Current stack'
      : peptideNames.length === 1
      ? `${peptideNames[0]} stack notes`
      : `Current stack: ${peptideNames.slice(0, 2).join(' + ')}${peptideNames.length > 2 ? ' +' : ''}`;

  const content = [
    intro,
    '',
    'Current setup:',
    ...stackPeptides.map((peptide) => {
      const details = [`${peptide.peptideName} - ${peptide.dosage} ${peptide.dosageUnit}`, peptide.frequency];

      if (peptide.timeOfDay) details.push(peptide.timeOfDay);
      if (peptide.duration) details.push(peptide.duration);

      return `- ${details.join(', ')}`;
    }),
    '',
    'Context / goals:',
    '- ',
    '',
    'What I want feedback on:',
    '- ',
  ].join('\n');

  return {
    title,
    content,
    tags: [],
    stackPeptides,
    sourceLabel: 'Prefilled from your tracker',
    templateKind: 'stack',
  };
}

export function buildThreadDraftFromProtocols(
  protocols: DoseProtocol[],
  intro = 'Sharing my current tracked stack from the app.'
): PreparedThreadComposerData {
  return {
    ...buildThreadDraftFromStackPeptides(buildStackPeptidesFromProtocols(protocols), intro),
    sourceLabel: 'Prefilled from active tracked protocols',
    templateKind: 'stack',
  };
}

function formatProgressStatus(log: DoseLog) {
  if (log.status === 'taken' && log.actualDate) {
    return `taken at ${new Date(log.actualDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }

  if (log.status === 'taken') return 'taken';
  if (log.status === 'skipped') return 'skipped';

  return 'scheduled';
}

export function buildProgressUpdateDraftFromLogs(
  logs: DoseLog[],
  protocols: DoseProtocol[],
  selectedDate: Date,
  intro = 'Posting a progress update from my tracker.'
): PreparedThreadComposerData {
  const uniqueProtocolIds = [...new Set(logs.map((log) => log.protocolId))];
  const protocolMap = new Map(protocols.map((protocol) => [protocol.id, protocol]));
  const stackPeptides = uniqueProtocolIds.map((protocolId) => {
    const protocol = protocolMap.get(protocolId);
    const fallbackLog = logs.find((log) => log.protocolId === protocolId);

    if (protocol) {
      return {
        peptideName: protocol.peptideName,
        dosage: protocol.targetDose,
        dosageUnit: protocol.targetDoseUnit,
        frequency: formatProtocolFrequency(protocol.frequency),
        timeOfDay: protocol.timeOfDay || protocol.specificTime || '',
        duration: formatProtocolDuration(protocol.endDate),
        notes: '',
      };
    }

    return {
      peptideName: fallbackLog?.peptideName || 'Tracked peptide',
      dosage: fallbackLog?.targetDose || 0,
      dosageUnit: fallbackLog?.doseUnit || 'mcg',
      frequency: 'tracked in app',
      timeOfDay: '',
      duration: '',
      notes: '',
    };
  });

  const peptideNames = stackPeptides.map((peptide) => peptide.peptideName);
  const takenCount = logs.filter((log) => log.status === 'taken').length;
  const title =
    peptideNames.length === 0
      ? `Progress update - ${selectedDate.toLocaleDateString()}`
      : `Progress update - ${selectedDate.toLocaleDateString()}: ${peptideNames.slice(0, 2).join(' + ')}${peptideNames.length > 2 ? ' +' : ''}`;

  const content = [
    intro,
    '',
    `Date: ${selectedDate.toLocaleDateString()}`,
    `Completion: ${takenCount}/${logs.length} scheduled dose${logs.length === 1 ? '' : 's'} marked taken.`,
    '',
    'Dose status:',
    ...logs.map((log) => `- ${log.peptideName} - ${log.targetDose} ${log.doseUnit} - ${formatProgressStatus(log)}`),
    '',
    'What I noticed:',
    '- ',
    '',
    'Questions / feedback:',
    '- ',
  ].join('\n');

  return {
    title,
    content,
    tags: [],
    stackPeptides,
    sourceLabel: 'Prefilled from tracked progress',
    templateKind: 'update',
  };
}
