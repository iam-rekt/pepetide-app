'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  type BloodworkMarker,
  type PeptideRanking,
  MARKER_DEFINITIONS,
  computeStatus,
  loadMarkers,
  saveMarkers,
  clearMarkers,
  findMarkerLabel,
  rankPeptidesByMarkers,
} from '@/lib/bloodwork';
import { DropletIcon, MoleculeIcon, VialIcon } from '@/components/icons';
import { ChevronDown, Plus, Trash2, Lock } from 'lucide-react';

interface Props {
  /** Names of peptides currently visible in the catalog (used to rank). */
  catalogPeptides: string[];
  /** Called when the user clicks a recommended peptide. */
  onSelectRecommended?: (peptideName: string) => void;
}

export default function BloodworkPanel({ catalogPeptides, onSelectRecommended }: Props) {
  const [markers, setMarkers] = useState<BloodworkMarker[]>([]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    setMarkers(loadMarkers());
  }, []);

  const startEditing = () => {
    const seed: Record<string, string> = {};
    for (const m of markers) {
      seed[m.id] = String(m.value);
    }
    setDraft(seed);
    setEditing(true);
  };

  const handleSave = () => {
    const next: BloodworkMarker[] = [];
    for (const def of MARKER_DEFINITIONS) {
      const raw = (draft[def.id] ?? '').trim();
      if (!raw) continue;
      const value = parseFloat(raw);
      if (!isFinite(value)) continue;
      next.push({
        id: def.id,
        label: def.label,
        value,
        unit: def.unit,
        status: computeStatus(value, def.range),
      });
    }
    saveMarkers(next);
    setMarkers(next);
    setEditing(false);
    setDraft({});
  };

  const handleClear = () => {
    if (!confirm('Clear all saved bloodwork? This deletes the data from your device.')) return;
    clearMarkers();
    setMarkers([]);
    setDraft({});
    setEditing(false);
  };

  const rankings: PeptideRanking[] = rankPeptidesByMarkers(catalogPeptides, markers);
  const outOfRangeCount = markers.filter((m) => m.status === 'low' || m.status === 'high').length;

  return (
    <Card className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border-white/30 dark:border-slate-700/40 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <DropletIcon className="w-5 h-5 text-emerald-500" />
              Personalize from your bloodwork
              <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/40">
                <Lock className="w-2.5 h-2.5" />
                local only
              </span>
            </CardTitle>
            <CardDescription className="mt-1.5 text-slate-700 dark:text-slate-300">
              Enter your lab markers and the catalog ranks peptides that target your out-of-range
              signals. Stored on this device only — never sent to a server.
            </CardDescription>
          </div>
          {markers.length > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 rounded-md text-slate-500 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 transition-colors"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </CardHeader>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardContent className="space-y-4 pt-0">
              {/* Empty state */}
              {markers.length === 0 && !editing && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-emerald-300/40 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20">
                  <div className="flex-1 text-sm text-slate-800 dark:text-slate-200">
                    Add a few markers (testosterone, IGF-1, hs-CRP, HbA1c…) to get peptide
                    suggestions ranked by what your labs actually show.
                  </div>
                  <Button
                    onClick={startEditing}
                    className="bg-gradient-to-br from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-white shadow-md shadow-emerald-500/30 ring-1 ring-white/30"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Enter Markers
                  </Button>
                </div>
              )}

              {/* Saved markers chips */}
              {markers.length > 0 && !editing && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    {markers.map((m) => (
                      <span
                        key={m.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono ${m.status === 'low'
                          ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/40'
                          : m.status === 'high'
                            ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-400/40'
                            : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-400/40'
                          }`}
                        title={`${m.label}: ${m.value} ${m.unit} (${m.status})`}
                      >
                        <span className="font-semibold">{m.label}</span>
                        <span className="opacity-80">
                          {m.value} {m.unit}
                        </span>
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={startEditing}
                      variant="outline"
                      size="sm"
                      className="border-emerald-300/50 text-emerald-700 dark:text-emerald-300 hover:border-emerald-400"
                    >
                      Edit markers
                    </Button>
                    <Button
                      onClick={handleClear}
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 dark:text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Clear
                    </Button>
                    <span className="ml-auto text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {outOfRangeCount} of {markers.length} out of range
                    </span>
                  </div>
                </>
              )}

              {/* Editor */}
              {editing && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-700 dark:text-slate-400">
                    Leave any field blank to skip. Reference ranges are typical adult ranges and
                    your lab&apos;s ranges may differ — use yours if known.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MARKER_DEFINITIONS.map((def) => (
                      <div key={def.id} className="space-y-1">
                        <Label htmlFor={def.id} className="text-xs flex items-baseline justify-between gap-2">
                          <span className="font-medium">{def.label}</span>
                          {def.range && (
                            <span className="text-[10px] font-mono text-slate-500">
                              {def.range.low}–{def.range.high} {def.unit}
                            </span>
                          )}
                        </Label>
                        <Input
                          id={def.id}
                          type="number"
                          step="any"
                          value={draft[def.id] ?? ''}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, [def.id]: e.target.value }))
                          }
                          placeholder={def.unit}
                          className="h-9 text-sm bg-white/70 dark:bg-slate-900/60 border-emerald-200/40 dark:border-emerald-800/40 focus-visible:ring-emerald-400/50"
                        />
                        <p className="text-[10px] text-slate-600 dark:text-slate-500">
                          {def.hint}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={handleSave}
                      className="bg-gradient-to-br from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-white shadow-md shadow-emerald-500/30 ring-1 ring-white/30"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setEditing(false);
                        setDraft({});
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {rankings.length > 0 && !editing && (
                <div className="pt-4 border-t border-white/30 dark:border-slate-700/40">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <MoleculeIcon className="w-4 h-4 text-emerald-500" />
                    Suggested for your markers
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {rankings.slice(0, 6).map((r) => (
                      <button
                        key={r.peptideName}
                        onClick={() => onSelectRecommended?.(r.peptideName)}
                        className="text-left rounded-lg border border-emerald-300/40 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 transition-all hover:border-emerald-400/70 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <VialIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            {r.peptideName}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                            {r.score}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {r.hits.map((h) => (
                            <span
                              key={h.marker}
                              className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400"
                            >
                              {h.direction === 'raise' ? '↑' : h.direction === 'lower' ? '↓' : '◆'}{' '}
                              {findMarkerLabel(h.marker)}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-slate-600 dark:text-slate-500">
                    Ranked by how directly each peptide targets your out-of-range markers.
                    Educational, not medical advice — consult a clinician.
                  </p>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
