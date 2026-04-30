/**
 * Local-first bloodwork tracking.
 *
 * Markers are stored in localStorage on the user's device — they are never
 * sent to a server. The peptide catalog is re-ranked client-side based on
 * which markers a given peptide targets.
 */

export type MarkerStatus = 'low' | 'normal' | 'high' | 'unknown';

export interface BloodworkMarker {
  /** Short stable id used for lookups, e.g. 'testosterone_total' */
  id: string;
  /** Display name, e.g. 'Total Testosterone' */
  label: string;
  /** Numeric value as the user entered it */
  value: number;
  /** Unit string, e.g. 'ng/dL', 'mg/dL', 'pg/mL' */
  unit: string;
  /** Computed status against `range` */
  status: MarkerStatus;
}

export interface MarkerDefinition {
  id: string;
  label: string;
  unit: string;
  /** Optional reference range used to compute high/low status */
  range?: { low: number; high: number };
  /** Short hint about what this marker tells you */
  hint: string;
}

export const MARKER_DEFINITIONS: MarkerDefinition[] = [
  { id: 'testosterone_total', label: 'Total Testosterone', unit: 'ng/dL', range: { low: 300, high: 1000 }, hint: 'Anabolic / libido / mood baseline' },
  { id: 'testosterone_free', label: 'Free Testosterone', unit: 'pg/mL', range: { low: 50, high: 210 }, hint: 'Bioavailable T fraction' },
  { id: 'igf1', label: 'IGF-1', unit: 'ng/mL', range: { low: 100, high: 280 }, hint: 'Growth-axis output (GH downstream)' },
  { id: 'gh', label: 'Growth Hormone (fasting)', unit: 'ng/mL', range: { low: 0.1, high: 5 }, hint: 'GH pulse snapshot — IGF-1 is more reliable' },
  { id: 'cortisol_am', label: 'Cortisol (AM)', unit: 'µg/dL', range: { low: 6, high: 18 }, hint: 'Stress / circadian output' },
  { id: 'tsh', label: 'TSH', unit: 'µIU/mL', range: { low: 0.4, high: 4 }, hint: 'Thyroid axis upstream signal' },
  { id: 't3_free', label: 'Free T3', unit: 'pg/mL', range: { low: 2.3, high: 4.2 }, hint: 'Active thyroid hormone' },
  { id: 't4_free', label: 'Free T4', unit: 'ng/dL', range: { low: 0.8, high: 1.8 }, hint: 'Thyroid hormone reservoir' },
  { id: 'hscrp', label: 'hs-CRP', unit: 'mg/L', range: { low: 0, high: 1 }, hint: 'Systemic inflammation' },
  { id: 'esr', label: 'ESR', unit: 'mm/hr', range: { low: 0, high: 20 }, hint: 'Slower-moving inflammation marker' },
  { id: 'ferritin', label: 'Ferritin', unit: 'ng/mL', range: { low: 30, high: 300 }, hint: 'Iron storage / inflammation cross-signal' },
  { id: 'vitamin_d', label: 'Vitamin D (25-OH)', unit: 'ng/mL', range: { low: 30, high: 80 }, hint: 'Steroid hormone precursor' },
  { id: 'b12', label: 'Vitamin B12', unit: 'pg/mL', range: { low: 232, high: 1245 }, hint: 'Energy / methylation / nerve' },
  { id: 'hba1c', label: 'HbA1c', unit: '%', range: { low: 4, high: 5.6 }, hint: 'Three-month glucose average' },
  { id: 'fasting_glucose', label: 'Fasting Glucose', unit: 'mg/dL', range: { low: 70, high: 99 }, hint: 'Insulin sensitivity baseline' },
  { id: 'ldl', label: 'LDL Cholesterol', unit: 'mg/dL', range: { low: 0, high: 100 }, hint: 'Lipid panel — atherogenic' },
  { id: 'hdl', label: 'HDL Cholesterol', unit: 'mg/dL', range: { low: 40, high: 100 }, hint: 'Lipid panel — protective' },
];

export function computeStatus(value: number, range?: MarkerDefinition['range']): MarkerStatus {
  if (!range) return 'unknown';
  if (value < range.low) return 'low';
  if (value > range.high) return 'high';
  return 'normal';
}

const STORAGE_KEY = 'pepetide_bloodwork_v1';

export function loadMarkers(): BloodworkMarker[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveMarkers(markers: BloodworkMarker[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
}

export function clearMarkers() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Per-peptide map of which markers it commonly targets and what direction it
 * pushes them. Used to rank the catalog by relevance.
 *
 * direction: 'raise' = peptide tends to raise the marker
 *            'lower' = peptide tends to lower the marker
 *            'modulate' = peptide normalizes regardless of direction
 *
 * NOT medical advice. Sourced from common biohacker / clinical lit; users
 * should always consult a clinician.
 */
export const PEPTIDE_TARGETS: Record<string, { marker: string; direction: 'raise' | 'lower' | 'modulate' }[]> = {
  'CJC-1295': [
    { marker: 'igf1', direction: 'raise' },
    { marker: 'gh', direction: 'raise' },
  ],
  'Ipamorelin': [
    { marker: 'igf1', direction: 'raise' },
    { marker: 'gh', direction: 'raise' },
  ],
  'Tesamorelin': [
    { marker: 'igf1', direction: 'raise' },
    { marker: 'gh', direction: 'raise' },
    { marker: 'ldl', direction: 'lower' },
  ],
  'BPC-157': [
    { marker: 'hscrp', direction: 'lower' },
    { marker: 'esr', direction: 'lower' },
  ],
  'TB-500': [
    { marker: 'hscrp', direction: 'lower' },
    { marker: 'esr', direction: 'lower' },
  ],
  'Thymosin Alpha-1': [
    { marker: 'hscrp', direction: 'modulate' },
  ],
  'Semaglutide': [
    { marker: 'hba1c', direction: 'lower' },
    { marker: 'fasting_glucose', direction: 'lower' },
    { marker: 'ldl', direction: 'lower' },
  ],
  'Tirzepatide': [
    { marker: 'hba1c', direction: 'lower' },
    { marker: 'fasting_glucose', direction: 'lower' },
    { marker: 'ldl', direction: 'lower' },
  ],
  'Kisspeptin': [
    { marker: 'testosterone_total', direction: 'raise' },
    { marker: 'testosterone_free', direction: 'raise' },
  ],
  'PT-141': [
    { marker: 'testosterone_total', direction: 'modulate' },
  ],
  'MOTS-c': [
    { marker: 'fasting_glucose', direction: 'lower' },
    { marker: 'hba1c', direction: 'lower' },
  ],
  'Epitalon': [
    { marker: 'cortisol_am', direction: 'modulate' },
  ],
  'Selank': [
    { marker: 'cortisol_am', direction: 'lower' },
  ],
  'Semax': [
    { marker: 'cortisol_am', direction: 'modulate' },
  ],
};

export interface PeptideRanking {
  peptideName: string;
  /** Higher = more relevant to user's out-of-range markers */
  score: number;
  /** Markers the peptide targets that are currently out of range */
  hits: { marker: string; status: MarkerStatus; direction: 'raise' | 'lower' | 'modulate' }[];
}

/**
 * Rank a list of peptide names by how well they address the user's
 * out-of-range markers. Returns ranked list (best first); peptides with
 * no relevant targets are filtered out.
 */
export function rankPeptidesByMarkers(
  peptideNames: string[],
  markers: BloodworkMarker[]
): PeptideRanking[] {
  if (markers.length === 0) return [];
  const markerById = new Map(markers.map((m) => [m.id, m]));

  const rankings: PeptideRanking[] = [];

  for (const name of peptideNames) {
    const targets = PEPTIDE_TARGETS[name];
    if (!targets) continue;

    const hits: PeptideRanking['hits'] = [];
    let score = 0;

    for (const t of targets) {
      const m = markerById.get(t.marker);
      if (!m) continue;

      const out = m.status === 'low' || m.status === 'high';
      const corrects =
        (m.status === 'low' && t.direction === 'raise') ||
        (m.status === 'high' && t.direction === 'lower') ||
        t.direction === 'modulate';

      if (out && corrects) {
        score += t.direction === 'modulate' ? 1 : 2;
        hits.push({ marker: t.marker, status: m.status, direction: t.direction });
      }
    }

    if (score > 0) {
      rankings.push({ peptideName: name, score, hits });
    }
  }

  rankings.sort((a, b) => b.score - a.score);
  return rankings;
}

export function findMarkerLabel(id: string): string {
  return MARKER_DEFINITIONS.find((m) => m.id === id)?.label ?? id;
}
