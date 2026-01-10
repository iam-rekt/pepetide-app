'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Plus } from 'lucide-react';
import { getPeptides, getActiveVials, addProtocol, addDoseLog } from '@/lib/db';
import type { Peptide, PeptideVial } from '@/types';
import { addDays, startOfToday } from 'date-fns';

interface ProtocolBuilderProps {
  onComplete: () => void;
}

export default function ProtocolBuilder({ onComplete }: ProtocolBuilderProps) {
  const [peptides, setPeptides] = useState<Peptide[]>([]);
  const [vials, setVials] = useState<PeptideVial[]>([]);
  const [selectedPeptideId, setSelectedPeptideId] = useState('');
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
  }

  const selectedPeptide = peptides.find(p => p.id === selectedPeptideId);
  const selectedVial = vials.find(v => v.id === selectedVialId);
  const filteredVials = vials.filter(v => v.peptideId === selectedPeptideId);

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
            status: 'pending',
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Build Dosing Protocol
        </CardTitle>
        <CardDescription>
          Set up a dosing schedule and auto-populate your calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Peptide Selection */}
        <div className="space-y-2">
          <Label htmlFor="peptide">Select Peptide</Label>
          <select
            id="peptide"
            value={selectedPeptideId}
            onChange={(e) => {
              setSelectedPeptideId(e.target.value);
              setSelectedVialId('');
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Choose a peptide...</option>
            {peptides.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Vial Selection */}
        {selectedPeptideId && (
          <div className="space-y-2">
            <Label htmlFor="vial">Select Vial</Label>
            <select
              id="vial"
              value={selectedVialId}
              onChange={(e) => setSelectedVialId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Choose a vial...</option>
              {filteredVials.map(v => (
                <option key={v.id} value={v.id}>
                  {v.vialSize}{v.vialSizeUnit}
                  {v.concentration && ` - ${v.concentration.toFixed(2)} ${v.concentrationUnit}`}
                </option>
              ))}
            </select>
            {filteredVials.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No active vials for this peptide. Please add a vial first.
              </p>
            )}
          </div>
        )}

        {/* Dosage */}
        {selectedVialId && (
          <>
            <div className="space-y-2">
              <Label htmlFor="targetDose">Target Dose Per Injection</Label>
              <div className="flex gap-2">
                <Input
                  id="targetDose"
                  type="number"
                  step="0.01"
                  value={targetDose}
                  onChange={(e) => setTargetDose(e.target.value)}
                  placeholder="250"
                  className="flex-1"
                />
                <select
                  value={targetDoseUnit}
                  onChange={(e) => setTargetDoseUnit(e.target.value as 'mcg' | 'mg')}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="mcg">mcg</option>
                  <option value="mg">mg</option>
                </select>
              </div>
              {selectedPeptide?.commonDosageRange && (
                <p className="text-xs text-muted-foreground">
                  Common range: {selectedPeptide.commonDosageRange.min}-{selectedPeptide.commonDosageRange.max} {selectedPeptide.commonDosageRange.unit}
                </p>
              )}
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <select
                id="frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="every-other-day">Every Other Day</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (weeks)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="52"
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(e.target.value)}
              />
            </div>

            {/* Time of Day */}
            <div className="space-y-2">
              <Label htmlFor="timeOfDay">Time of Day</Label>
              <select
                id="timeOfDay"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="before-bed">Before Bed</option>
              </select>
            </div>

            {/* Summary */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-2">Protocol Summary</h4>
              <ul className="text-sm space-y-1">
                <li>• {selectedPeptide?.name} - {targetDose} {targetDoseUnit}</li>
                <li>• Frequency: {frequency === 'daily' ? 'Every day' : frequency === 'every-other-day' ? 'Every other day' : 'Once per week'}</li>
                <li>• Duration: {durationWeeks} weeks</li>
                <li>• Time: {timeOfDay}</li>
                <li>• Total doses: {
                  frequency === 'daily' ? parseInt(durationWeeks) * 7 :
                  frequency === 'every-other-day' ? Math.floor(parseInt(durationWeeks) * 7 / 2) :
                  parseInt(durationWeeks)
                }</li>
              </ul>
            </div>

            <Button onClick={handleCreateProtocol} disabled={loading} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              {loading ? 'Creating Protocol...' : 'Create Protocol & Schedule Doses'}
            </Button>
          </>
        )}

        {!selectedPeptideId && peptides.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No peptides available. Please add a peptide first.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
