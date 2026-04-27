'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, ArrowLeft, Check, Zap, Info, MessageSquare } from 'lucide-react';
import { getPeptides, getActiveVials, addProtocol, addDoseLog } from '@/lib/db';
import { syncData } from '@/lib/sync';
import type { Peptide, PeptideVial, StackPeptideInfo, ViewMode } from '@/types';
import { addDays, startOfToday } from 'date-fns';
import { queuePreparedThreadDraft } from '@/lib/community-storage';
import { buildThreadDraftFromStackPeptides } from '@/lib/thread-sharing';

interface ProtocolBuilderProps {
  onComplete: () => void;
  onNavigate?: (view: ViewMode) => void;
  preSelectedVialId?: string; // Optional: auto-select this vial
}

export default function ProtocolBuilder({ onComplete, onNavigate, preSelectedVialId }: ProtocolBuilderProps) {
  const [peptides, setPeptides] = useState<Peptide[]>([]);
  const [vials, setVials] = useState<PeptideVial[]>([]);
  const [selectedVialId, setSelectedVialId] = useState('');
  const [targetDose, setTargetDose] = useState('');
  const [targetDoseUnit, setTargetDoseUnit] = useState<'mcg' | 'mg'>('mcg');
  const [frequency, setFrequency] = useState<'daily' | 'every-other-day' | 'weekly'>('daily');
  const [durationWeeks, setDurationWeeks] = useState('4');
  const [timeOfDay, setTimeOfDay] = useState('morning');
  const [startDate, setStartDate] = useState(startOfToday().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    const [allPeptides, activeVials] = await Promise.all([
      getPeptides(),
      getActiveVials(),
    ]);
    setPeptides(allPeptides);
    setVials(activeVials);

    // Auto-select the vial associated with the most recently created vial that
    // belongs to a known peptide. Skip orphaned vials (peptide deleted).
    if (preSelectedVialId && activeVials.find(v => v.id === preSelectedVialId)) {
      setSelectedVialId(preSelectedVialId);
      return;
    }

    const known = activeVials.filter(v => allPeptides.some(p => p.id === v.peptideId));
    if (known.length > 0) {
      const newest = [...known].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      setSelectedVialId(newest.id);
    }
  }, [preSelectedVialId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedVial = vials.find(v => v.id === selectedVialId);
  const selectedPeptide = selectedVial ? peptides.find(p => p.id === selectedVial.peptideId) : null;

  // Build the picker list: one row per peptide that has at least one active vial.
  // Pre-selects each peptide's most recent active vial.
  const peptideOptions = peptides
    .map(peptide => {
      const peptideVials = vials
        .filter(v => v.peptideId === peptide.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { peptide, vial: peptideVials[0] ?? null };
    })
    .filter(opt => opt.vial !== null);

  const buildCurrentStackDraft = (): StackPeptideInfo[] => {
    if (!selectedPeptide || !targetDose) {
      return [];
    }

    return [{
      peptideName: selectedPeptide.name,
      dosage: parseFloat(targetDose),
      dosageUnit: targetDoseUnit,
      frequency: frequency === 'every-other-day' ? 'every other day' : frequency,
      timeOfDay,
      duration: `${durationWeeks} weeks`,
      notes: '',
    }];
  };

  const handleSharePlannedStack = () => {
    const stackPeptides = buildCurrentStackDraft();

    if (stackPeptides.length === 0) {
      alert('Add a dose and protocol details before sharing this plan.');
      return;
    }

    queuePreparedThreadDraft(
      buildThreadDraftFromStackPeptides(stackPeptides, 'Sharing a planned stack I am setting up in the app.')
    );

    if (onNavigate) {
      onNavigate('sys');
    }
  };

  const handleCreateProtocol = async () => {
    const missing: string[] = [];
    if (!selectedVial) missing.push('a peptide / vial');
    if (!targetDose) missing.push('a target dose');
    if (!durationWeeks) missing.push('a duration');
    if (missing.length > 0) {
      alert(`Please choose ${missing.join(', ')} before creating the protocol.`);
      return;
    }
    if (!selectedPeptide || !selectedVial) {
      alert('The selected vial is missing its peptide. Try re-selecting.');
      return;
    }

    setLoading(true);

    try {
      // Calculate volume per dose if vial is reconstituted
      let volumePerDose: number | undefined;
      if (selectedVial.concentration) {
        const doseInMg = targetDoseUnit === 'mg' ? parseFloat(targetDose) : parseFloat(targetDose) / 1000;
        volumePerDose = doseInMg / selectedVial.concentration;
      }

      // Create the protocol
      const protocolStartDate = new Date(startDate);
      const endDate = addDays(protocolStartDate, parseInt(durationWeeks) * 7);

      const protocol = await addProtocol({
        vialId: selectedVial.id,
        peptideId: selectedPeptide.id,
        peptideName: selectedPeptide.name,
        targetDose: parseFloat(targetDose),
        targetDoseUnit,
        volumePerDose,
        frequency,
        startDate: protocolStartDate,
        endDate,
        timeOfDay,
        isActive: true,
      });

      // Generate dose logs based on frequency
      const days = parseInt(durationWeeks) * 7;
      const doseLogs = [];

      for (let i = 0; i < days; i++) {
        const scheduledDate = addDays(protocolStartDate, i);

        // Skip based on frequency
        if (frequency === 'every-other-day' && i % 2 !== 0) continue;
        if (frequency === 'weekly' && i % 7 !== 0) continue;

        doseLogs.push(
          addDoseLog({
            protocolId: protocol.id,
            vialId: selectedVial.id,
            peptideId: selectedPeptide.id,
            peptideName: selectedPeptide.name,
            scheduledDate,
            targetDose: parseFloat(targetDose),
            doseUnit: targetDoseUnit,
            volumeInjected: volumePerDose,
            status: 'pending',
          })
        );
      }

      await Promise.all(doseLogs);

      // Trigger sync
      syncData();

      alert(`Protocol created with ${doseLogs.length} doses scheduled!`);
      onComplete();
    } catch (error) {
      console.error('Error creating protocol:', error);
      alert('Failed to create protocol. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (vials.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <Card className="border border-white/20 dark:border-blue-800/30 bg-white/5 dark:bg-slate-900/5 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl">No Vials Available</CardTitle>
            <CardDescription className="text-base">
              You need to add a peptide stack first before creating a protocol
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-2">Quick Start:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to &quot;Add Stack&quot;</li>
                <li>Create your first peptide + vial</li>
                <li>Return here to build your dosing protocol</li>
              </ol>
            </div>
            <Button
              onClick={() => window.history.back()}
              className="w-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black dark:from-slate-200 dark:to-slate-100 dark:hover:from-slate-100 dark:hover:to-white dark:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const totalDoses = frequency === 'daily'
    ? parseInt(durationWeeks) * 7
    : frequency === 'every-other-day'
      ? Math.floor(parseInt(durationWeeks) * 7 / 2)
      : parseInt(durationWeeks);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-white/5 dark:bg-slate-950/5 border border-white/20 dark:border-slate-600/20 backdrop-blur-sm p-8"
      >
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100 rounded-xl shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                Build Protocol
              </h1>
              <p className="text-sm text-muted-foreground">
                Auto-schedule your doses for the entire duration
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Peptide / Vial picker — always visible */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-white/5 dark:bg-slate-900/5 border border-white/20 dark:border-slate-600/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Choose Peptide
            </CardTitle>
            <CardDescription>
              Pick which peptide vial this protocol is for. We schedule doses against this vial.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="peptideSelect" className="text-base font-semibold">
                Peptide *
              </Label>
              <select
                id="peptideSelect"
                value={selectedVialId}
                onChange={(e) => setSelectedVialId(e.target.value)}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
              >
                <option value="">— Select a peptide —</option>
                {peptideOptions.map(({ peptide, vial }) => (
                  <option key={peptide.id} value={vial!.id}>
                    {peptide.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {peptideOptions.length} peptide{peptideOptions.length === 1 ? '' : 's'} ready to schedule.
              </p>
            </div>

            {selectedVial && selectedPeptide && (
              <div className="rounded-lg border border-emerald-300/40 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-4">
                <h3 className="text-xl font-bold mb-1">{selectedPeptide.name}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>Vial: {selectedVial.vialSize} {selectedVial.vialSizeUnit}</span>
                  {selectedVial.concentration && (
                    <span>Concentration: {selectedVial.concentration.toFixed(2)} {selectedVial.concentrationUnit}</span>
                  )}
                </div>
                {selectedPeptide.commonDosageRange && (
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Common range:</span>{' '}
                    <span className="font-medium">
                      {selectedPeptide.commonDosageRange.min}-{selectedPeptide.commonDosageRange.max} {selectedPeptide.commonDosageRange.unit}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Protocol Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border border-white/20 dark:border-purple-800/30 bg-white/5 dark:bg-slate-900/5 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle>Protocol Configuration</CardTitle>
            <CardDescription>
              Set your dosing schedule and we&apos;ll auto-populate your calendar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Target Dose */}
              <div className="space-y-2">
                <Label htmlFor="targetDose" className="text-base font-semibold">
                  Target Dose Per Injection *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="targetDose"
                    type="number"
                    step="0.01"
                    value={targetDose}
                    onChange={(e) => setTargetDose(e.target.value)}
                    placeholder="250"
                    className="flex-1 h-12 text-lg"
                  />
                  <select
                    value={targetDoseUnit}
                    onChange={(e) => setTargetDoseUnit(e.target.value as 'mcg' | 'mg')}
                    className="flex h-12 rounded-md border border-input bg-background px-3 py-2 text-sm w-24"
                  >
                    <option value="mcg">mcg</option>
                    <option value="mg">mg</option>
                  </select>
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-base font-semibold">
                  Start Date *
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={startOfToday().toISOString().split('T')[0]}
                  className="h-12 text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  When to start this protocol (can be future date)
                </p>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-base font-semibold">
                  Duration (weeks) *
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="52"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>

              {/* Frequency */}
              <div className="space-y-2">
                <Label htmlFor="frequency" className="text-base font-semibold">
                  Frequency *
                </Label>
                <select
                  id="frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as 'daily' | 'every-other-day' | 'weekly')}
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="daily">Every Day</option>
                  <option value="every-other-day">Every Other Day</option>
                  <option value="weekly">Once Per Week</option>
                </select>
              </div>

              {/* Time of Day */}
              <div className="space-y-2">
                <Label htmlFor="timeOfDay" className="text-base font-semibold">
                  Time of Day
                </Label>
                <select
                  id="timeOfDay"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="before-bed">Before Bed</option>
                </select>
              </div>
            </div>

            {/* Summary */}
            {targetDose && durationWeeks && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-white/5 dark:bg-slate-900/5 rounded-xl border border-white/20 dark:border-slate-600/30 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100 rounded-lg">
                    <Info className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-3 text-lg">Protocol Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Dose</div>
                        <div className="font-semibold">{targetDose} {targetDoseUnit}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Frequency</div>
                        <div className="font-semibold capitalize">{frequency.replace('-', ' ')}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Duration</div>
                        <div className="font-semibold">{durationWeeks} weeks</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Total Doses</div>
                        <div className="font-semibold text-purple-600 dark:text-purple-400 text-lg">
                          {totalDoses}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={handleSharePlannedStack}
                disabled={!targetDose || !selectedVialId}
                className="h-14 text-base sm:flex-1"
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Share This Plan in Threads
              </Button>
              <Button
                onClick={handleCreateProtocol}
                disabled={loading || !targetDose || !selectedVialId}
                className="h-14 text-lg bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black dark:from-slate-200 dark:to-slate-100 dark:hover:from-slate-100 dark:hover:to-white dark:text-slate-900 sm:flex-[1.35]"
              >
                {loading ? 'Creating Protocol...' : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Create Protocol & Schedule {totalDoses} Doses
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
