'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, X } from 'lucide-react';
import {
  clearPeptideSubmissionDraft,
  loadCommunityAlias,
  loadPeptideSubmissionDraft,
  saveCommunityAlias,
  savePeptideSubmissionDraft,
} from '@/lib/community-storage';

interface SubmitPeptideFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function SubmitPeptideForm({ onBack, onSuccess }: SubmitPeptideFormProps) {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dosageMin, setDosageMin] = useState('');
  const [dosageMax, setDosageMax] = useState('');
  const [dosageUnit, setDosageUnit] = useState<'mcg' | 'mg'>('mcg');
  const [benefits, setBenefits] = useState<string[]>(['']);
  const [contraindications, setContraindications] = useState<string[]>(['']);
  const [warnings, setWarnings] = useState<string[]>(['']);
  const [storageInstructions, setStorageInstructions] = useState('Refrigerate at 2-8°C after reconstitution');
  const [unreconShelfLife, setUnreconShelfLife] = useState('Store in freezer until use');
  const [reconShelfLife, setReconShelfLife] = useState('4-6 weeks when refrigerated');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('personal-experience');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedDraft = loadPeptideSubmissionDraft();
    const savedAlias = loadCommunityAlias();

    setUsername(savedDraft.username || savedAlias);
    setName(savedDraft.name);
    setDescription(savedDraft.description);
    setDosageMin(savedDraft.dosageMin);
    setDosageMax(savedDraft.dosageMax);
    setDosageUnit(savedDraft.dosageUnit);
    setBenefits(savedDraft.benefits);
    setContraindications(savedDraft.contraindications);
    setWarnings(savedDraft.warnings);
    setStorageInstructions(savedDraft.storageInstructions);
    setUnreconShelfLife(savedDraft.unreconShelfLife);
    setReconShelfLife(savedDraft.reconShelfLife);
    setNotes(savedDraft.notes);
    setSource(savedDraft.source);
  }, []);

  useEffect(() => {
    savePeptideSubmissionDraft({
      username,
      name,
      description,
      dosageMin,
      dosageMax,
      dosageUnit,
      benefits,
      contraindications,
      warnings,
      storageInstructions,
      unreconShelfLife: unreconShelfLife,
      reconShelfLife,
      notes,
      source,
    });
  }, [
    username,
    name,
    description,
    dosageMin,
    dosageMax,
    dosageUnit,
    benefits,
    contraindications,
    warnings,
    storageInstructions,
    unreconShelfLife,
    reconShelfLife,
    notes,
    source,
  ]);

  useEffect(() => {
    if (username.trim()) {
      saveCommunityAlias(username);
    }
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !name) {
      alert('Username and peptide name are required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/peptides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          name,
          description: description || undefined,
          dosage_min: dosageMin ? parseFloat(dosageMin) : undefined,
          dosage_max: dosageMax ? parseFloat(dosageMax) : undefined,
          dosage_unit: dosageUnit,
          benefits: benefits.filter(b => b.trim()),
          contraindications: contraindications.filter(c => c.trim()),
          warnings: warnings.filter(w => w.trim()),
          storage_instructions: storageInstructions || undefined,
          unreconstituted_shelf_life: unreconShelfLife,
          reconstituted_shelf_life: reconShelfLife,
          notes: notes || undefined,
          source,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        saveCommunityAlias(username);
        clearPeptideSubmissionDraft();
        alert(data.isNew ? 'New peptide submitted successfully!' : 'Your submission has been added to this peptide!');
        onSuccess();
      } else {
        throw new Error(data.error || 'Failed to submit');
      }
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Failed to submit peptide. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Submit Peptide to Community Database</CardTitle>
          <CardDescription>
            Share useful information under an alias. Your alias and draft stay saved only on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <Label htmlFor="username">Your Username/Alias *</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., PeptideResearcher123"
                required
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This alias is publicly visible on the submission. Use a pseudonym if you want to stay anonymous.
              </p>
            </div>

            {/* Peptide Name */}
            <div>
              <Label htmlFor="name">Peptide Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., BPC-157, TB-500, CJC-1295"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                If this peptide already exists, your submission will be added to it.
              </p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the peptide and its primary use"
              />
            </div>

            {/* Dosage Range */}
            <div className="space-y-4">
              <h3 className="font-semibold">Recommended Dosage Range (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dosageMin">Minimum</Label>
                  <Input
                    id="dosageMin"
                    type="number"
                    step="0.01"
                    value={dosageMin}
                    onChange={(e) => setDosageMin(e.target.value)}
                    placeholder="200"
                  />
                </div>
                <div>
                  <Label htmlFor="dosageMax">Maximum</Label>
                  <Input
                    id="dosageMax"
                    type="number"
                    step="0.01"
                    value={dosageMax}
                    onChange={(e) => setDosageMax(e.target.value)}
                    placeholder="500"
                  />
                </div>
                <div>
                  <Label htmlFor="dosageUnit">Unit</Label>
                  <select
                    id="dosageUnit"
                    value={dosageUnit}
                    onChange={(e) => setDosageUnit(e.target.value as 'mcg' | 'mg')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="mcg">mcg</option>
                    <option value="mg">mg</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <Label>Benefits (Optional)</Label>
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={benefit}
                    onChange={(e) => {
                      const newBenefits = [...benefits];
                      newBenefits[index] = e.target.value;
                      setBenefits(newBenefits);
                    }}
                    placeholder="e.g., Accelerates wound healing"
                  />
                  {benefits.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setBenefits(benefits.filter((_, i) => i !== index))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBenefits([...benefits, ''])}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Benefit
              </Button>
            </div>

            {/* Contraindications */}
            <div className="space-y-2">
              <Label>Contraindications (Optional)</Label>
              {contraindications.map((contra, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={contra}
                    onChange={(e) => {
                      const newContras = [...contraindications];
                      newContras[index] = e.target.value;
                      setContraindications(newContras);
                    }}
                    placeholder="e.g., Active cancer"
                  />
                  {contraindications.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setContraindications(contraindications.filter((_, i) => i !== index))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setContraindications([...contraindications, ''])}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contraindication
              </Button>
            </div>

            {/* Warnings */}
            <div className="space-y-2">
              <Label>Safety Warnings (Optional)</Label>
              {warnings.map((warning, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={warning}
                    onChange={(e) => {
                      const newWarnings = [...warnings];
                      newWarnings[index] = e.target.value;
                      setWarnings(newWarnings);
                    }}
                    placeholder="e.g., Do not mix with other peptides"
                  />
                  {warnings.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setWarnings(warnings.filter((_, i) => i !== index))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setWarnings([...warnings, ''])}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Warning
              </Button>
            </div>

            {/* Source */}
            <div>
              <Label htmlFor="source">Information Source</Label>
              <select
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
              >
                <option value="personal-experience">Personal Experience</option>
                <option value="clinical-study">Clinical Study</option>
                <option value="research-paper">Research Paper</option>
                <option value="healthcare-provider">Healthcare Provider</option>
                <option value="community-knowledge">Community Knowledge</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information you'd like to share..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                rows={4}
              />
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-md border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-900 dark:text-yellow-200">
                <strong>Disclaimer:</strong> By submitting, you acknowledge that this information is for educational purposes only and should not be considered medical advice. Users are responsible for verifying all information.
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Submitting...' : 'Submit to Community Database'}
              </Button>
              <Button type="button" variant="outline" onClick={onBack}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
