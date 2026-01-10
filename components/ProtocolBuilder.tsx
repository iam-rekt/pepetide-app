'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Plus, ArrowLeft, Check, Zap, Info } from 'lucide-react';
import { getPeptides, getActiveVials, addProtocol, addDoseLog } from '@/lib/db';
import type { Peptide, PeptideVial } from '@/types';
import { addDays, startOfToday } from 'date-fns';

interface ProtocolBuilderProps {
  onComplete: () => void;
  preSelectedVialId?: string; // Optional: auto-select this vial
}

export default function ProtocolBuilder({ onComplete, preSelectedVialId }: ProtocolBuilderProps) {
  const [peptides, setPeptides] = useState<Peptide[]>([]);
  const [vials, setVials] = useState<PeptideVial[]>([]);
  const [selectedVialId, setSelectedVialId] = useState('');
  const [targetDose, setTargetDose] = useState('');
  const [targetDoseUnit, setTargetDoseUnit] = useState<'mcg' | 'mg'>('mcg');
  const [frequency, setFrequency] = useState<'daily' | 'every-other-day' | 'weekly'>('daily');
  const [durationWeeks, setDurationWeeks] = useState('4');
  const [timeOfDay, setTimeOfDay] = useState('morning');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [allPeptides, activeVials] = await Promise.all([
      getPeptides(),
      getActiveVials(),
    ]);
    setPeptides(allPeptides);
    setVials(activeVials);

    // Auto-select vial logic:
    // 1. Use preSelectedVialId if provided
    // 2. Otherwise, use the most recently created vial
    if (preSelectedVialId && activeVials.find(v => v.id === preSelectedVialId)) {
      setSelectedVialId(preSelectedVialId);
    } else if (activeVials.length > 0) {
      // Sort by creation date and pick the most recent
      const sortedVials = [...activeVials].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setSelectedVialId(sortedVials[0].id);
    }
  }

  const selectedVial = vials.find(v => v.id === selectedVialId);
  const selectedPeptide = selectedVial ? peptides.find(p => p.id === selectedVial.peptideId) : null;

  const handleCreateProtocol = async () => {
    if (!selectedPeptide || !selectedVial || !targetDose) {
      alert('Please fill in all required fields');
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
      const startDate = startOfToday();
      const endDate = addDays(startDate, parseInt(durationWeeks) * 7);

      const protocol = await addProtocol({
        vialId: selectedVial.id,
        peptideId: selectedPeptide.id,
        peptideName: selectedPeptide.name,
        targetDose: parseFloat(targetDose),
        targetDoseUnit,
        volumePerDose,
        frequency,
        startDate,
        endDate,
        timeOfDay,
        isActive: true,
      });

      // Generate dose logs based on frequency
      const days = parseInt(durationWeeks) * 7;
      const doseLogs = [];

      for (let i = 0; i < days; i++) {
        const scheduledDate = addDays(startDate, i);

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
            status: 'scheduled',
          })
        );
      }

      await Promise.all(doseLogs);

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
                <li>Go to "Add Stack"</li>
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

      {/* Selected Vial Info */}
      {selectedVial && selectedPeptide && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/5 dark:bg-slate-900/5 border border-white/20 dark:border-slate-600/30 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      Using Your Latest Vial
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{selectedPeptide.name}</h3>
                  <div className="flex gap-4 text-sm text-muted-foreground">
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

                {/* Change vial option */}
                {vials.length > 1 && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="vialSelect" className="text-xs">Change vial</Label>
                    <select
                      id="vialSelect"
                      value={selectedVialId}
                      onChange={(e) => setSelectedVialId(e.target.value)}
                      className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      {vials.map(v => {
                        const peptide = peptides.find(p => p.id === v.peptideId);
                        return (
                          <option key={v.id} value={v.id}>
                            {peptide?.name} - {v.vialSize}{v.vialSizeUnit}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

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
              Set your dosing schedule and we'll auto-populate your calendar
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
                  onChange={(e) => setFrequency(e.target.value as any)}
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

            <Button
              onClick={handleCreateProtocol}
              disabled={loading || !targetDose || !selectedVialId}
              className="w-full h-14 text-lg bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black dark:from-slate-200 dark:to-slate-100 dark:hover:from-slate-100 dark:hover:to-white dark:text-slate-900"
            >
              {loading ? 'Creating Protocol...' : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Create Protocol & Schedule {totalDoses} Doses
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
