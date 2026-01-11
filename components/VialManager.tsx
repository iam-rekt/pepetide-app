'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Beaker, Plus, Trash2 } from 'lucide-react';
import { getPeptides, addVial, getVials, deleteVial } from '@/lib/db';
import { syncData } from '@/lib/sync';
import { calculateExpirationDate, getRecommendedBacteriostaticWater } from '@/lib/calculator';
import type { Peptide, PeptideVial } from '@/types';
import { format } from 'date-fns';

interface VialManagerProps {
  onComplete?: () => void;
}

export default function VialManager({ onComplete }: VialManagerProps) {
  const [peptides, setPeptides] = useState<Peptide[]>([]);
  const [vials, setVials] = useState<PeptideVial[]>([]);
  const [selectedPeptideId, setSelectedPeptideId] = useState('');
  const [vialSize, setVialSize] = useState('');
  const [vialSizeUnit, setVialSizeUnit] = useState<'mg' | 'mcg'>('mg');
  const [bacteriostaticWater, setBacteriostaticWater] = useState('');
  const [receivedDate, setReceivedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reconstitutedDate, setReconstitutedDate] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [allPeptides, allVials] = await Promise.all([
      getPeptides(),
      getVials(),
    ]);
    setPeptides(allPeptides);
    setVials(allVials);
  }

  const selectedPeptide = peptides.find(p => p.id === selectedPeptideId);
  const recommendations = vialSize
    ? getRecommendedBacteriostaticWater(parseFloat(vialSize), vialSizeUnit)
    : [];

  const handleAddVial = async () => {
    if (!selectedPeptideId || !vialSize || !receivedDate) {
      alert('Please fill in required fields');
      return;
    }

    setLoading(true);

    try {
      const peptide = peptides.find(p => p.id === selectedPeptideId);
      if (!peptide) return;

      const reconDate = reconstitutedDate ? new Date(reconstitutedDate) : undefined;
      const expirationDate = reconDate ? calculateExpirationDate(reconDate, 6) : undefined;

      await addVial({
        peptideId: selectedPeptide!.id,
        peptideName: selectedPeptide!.name,
        vialSize: parseFloat(vialSize),
        vialSizeUnit,
        bacteriostaticWaterAdded: bacteriostaticWater ? parseFloat(bacteriostaticWater) : undefined,
        receivedDate: new Date(receivedDate),
        reconstitutedDate: reconDate,
        expirationDate,
        batchNumber: batchNumber || undefined,
        isActive: true,
      });

      // Reset form
      setSelectedPeptideId('');
      setVialSize('');
      setBacteriostaticWater('');
      setReconstitutedDate('');
      setBatchNumber('');

      await loadData();

      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error adding vial:', error);
      alert('Failed to add vial. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVial = async (vialId: string) => {
    if (!confirm('Are you sure you want to delete this vial?')) return;

    await deleteVial(vialId);
    await loadData();

    // Trigger sync to update calendar
    syncData();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Add Vial Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Vial
          </CardTitle>
          <CardDescription>
            Record a new peptide vial and reconstitution details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="peptide">Peptide</Label>
            <select
              id="peptide"
              value={selectedPeptideId}
              onChange={(e) => setSelectedPeptideId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a peptide...</option>
              {peptides.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="vialSize">Vial Size</Label>
            <div className="flex gap-2">
              <Input
                id="vialSize"
                type="number"
                step="0.01"
                value={vialSize}
                onChange={(e) => setVialSize(e.target.value)}
                placeholder="5"
                className="flex-1"
              />
              <select
                value={vialSizeUnit}
                onChange={(e) => setVialSizeUnit(e.target.value as 'mg' | 'mcg')}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="mg">mg</option>
                <option value="mcg">mcg</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="bacteriostaticWater">Bacteriostatic Water Added (mL)</Label>
            <Input
              id="bacteriostaticWater"
              type="number"
              step="0.1"
              value={bacteriostaticWater}
              onChange={(e) => setBacteriostaticWater(e.target.value)}
              placeholder="Optional"
            />
            {recommendations.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: {recommendations.join(', ')} mL
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="receivedDate">Received Date</Label>
            <Input
              id="receivedDate"
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="reconstitutedDate">Reconstituted Date (Optional)</Label>
            <Input
              id="reconstitutedDate"
              type="date"
              value={reconstitutedDate}
              onChange={(e) => setReconstitutedDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="batchNumber">Batch Number (Optional)</Label>
            <Input
              id="batchNumber"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="e.g., BAT-2024-001"
            />
          </div>

          <Button onClick={handleAddVial} disabled={loading} className="w-full">
            {loading ? 'Adding...' : 'Add Vial'}
          </Button>
        </CardContent>
      </Card>

      {/* Vial List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Beaker className="w-5 h-5" />
            Your Vials
          </CardTitle>
          <CardDescription>
            {vials.length} vial{vials.length !== 1 ? 's' : ''} in inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No vials added yet
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {vials.map(vial => (
                <div
                  key={vial.id}
                  className="p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold">{vial.peptideName}</div>
                      <div className="text-sm text-muted-foreground">
                        {vial.vialSize} {vial.vialSizeUnit}
                        {vial.concentration && (
                          <> • {vial.concentration.toFixed(2)} {vial.concentrationUnit}</>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteVial(vial.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Received: {format(new Date(vial.receivedDate), 'MMM d, yyyy')}</div>
                    {vial.reconstitutedDate && (
                      <div>Reconstituted: {format(new Date(vial.reconstitutedDate), 'MMM d, yyyy')}</div>
                    )}
                    {vial.expirationDate && (
                      <div className={
                        new Date(vial.expirationDate) < new Date()
                          ? 'text-red-600 dark:text-red-400 font-semibold'
                          : ''
                      }>
                        Expires: {format(new Date(vial.expirationDate), 'MMM d, yyyy')}
                      </div>
                    )}
                    {vial.batchNumber && (
                      <div>Batch: {vial.batchNumber}</div>
                    )}
                  </div>

                  {!vial.isActive && (
                    <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                      Inactive
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
