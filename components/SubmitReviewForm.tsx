'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CommunityPeptide } from './CommunityView';
import {
  clearPeptideReviewDraft,
  loadCommunityAlias,
  loadPeptideReviewDraft,
  saveCommunityAlias,
  savePeptideReviewDraft,
} from '@/lib/community-storage';

interface SubmitReviewFormProps {
  peptide: CommunityPeptide;
  onBack: () => void;
  onSuccess: () => void;
}

export default function SubmitReviewForm({ peptide, onBack, onSuccess }: SubmitReviewFormProps) {
  const [username, setUsername] = useState('');
  const [dosageUsed, setDosageUsed] = useState('');
  const [dosageUnit, setDosageUnit] = useState<'mcg' | 'mg'>('mcg');
  const [frequency, setFrequency] = useState('');
  const [durationWeeks, setDurationWeeks] = useState('');
  const [benefitsExperienced, setBenefitsExperienced] = useState<string[]>(['']);
  const [sideEffects, setSideEffects] = useState<string[]>(['']);
  const [effectivenessRating, setEffectivenessRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedDraft = loadPeptideReviewDraft(peptide.id);
    const savedAlias = loadCommunityAlias();

    setUsername(savedDraft.username || savedAlias);
    setDosageUsed(savedDraft.dosageUsed);
    setDosageUnit(savedDraft.dosageUnit);
    setFrequency(savedDraft.frequency);
    setDurationWeeks(savedDraft.durationWeeks);
    setBenefitsExperienced(savedDraft.benefitsExperienced);
    setSideEffects(savedDraft.sideEffects);
    setEffectivenessRating(savedDraft.effectivenessRating);
    setNotes(savedDraft.notes);
  }, [peptide.id]);

  useEffect(() => {
    savePeptideReviewDraft(peptide.id, {
      username,
      dosageUsed,
      dosageUnit,
      frequency,
      durationWeeks,
      benefitsExperienced,
      sideEffects,
      effectivenessRating,
      notes,
    });
  }, [
    peptide.id,
    username,
    dosageUsed,
    dosageUnit,
    frequency,
    durationWeeks,
    benefitsExperienced,
    sideEffects,
    effectivenessRating,
    notes,
  ]);

  useEffect(() => {
    if (username.trim()) {
      saveCommunityAlias(username);
    }
  }, [username]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!username.trim()) {
      setError('An alias is required to publish a review.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/peptides/${peptide.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          peptide_name: peptide.name,
          dosage_used: dosageUsed ? parseFloat(dosageUsed) : undefined,
          dosage_unit: dosageUnit,
          frequency: frequency || undefined,
          duration_weeks: durationWeeks ? parseInt(durationWeeks, 10) : undefined,
          benefits_experienced: benefitsExperienced.filter(item => item.trim()),
          side_effects: sideEffects.filter(item => item.trim()),
          effectiveness_rating: effectivenessRating || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      saveCommunityAlias(username);
      clearPeptideReviewDraft(peptide.id);
      onSuccess();
    } catch (submissionError) {
      console.error('Error submitting review:', submissionError);
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const updateListItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    items: string[],
    index: number,
    value: string
  ) => {
    const nextItems = [...items];
    nextItems[index] = value;
    setter(nextItems);
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Write a Review for {peptide.name}</CardTitle>
          <CardDescription>
            Share real-world results under an alias. Your alias and draft stay saved only on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="review-username">Your Alias</Label>
              <Input
                id="review-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="e.g. stacknotes"
                className="mt-2"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="review-dosage">Dosage Used</Label>
                <Input
                  id="review-dosage"
                  type="number"
                  step="0.01"
                  value={dosageUsed}
                  onChange={(event) => setDosageUsed(event.target.value)}
                  placeholder="200"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="review-unit">Unit</Label>
                <select
                  id="review-unit"
                  value={dosageUnit}
                  onChange={(event) => setDosageUnit(event.target.value as 'mcg' | 'mg')}
                  className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="mcg">mcg</option>
                  <option value="mg">mg</option>
                </select>
              </div>
              <div>
                <Label htmlFor="review-duration">Duration (weeks)</Label>
                <Input
                  id="review-duration"
                  type="number"
                  value={durationWeeks}
                  onChange={(event) => setDurationWeeks(event.target.value)}
                  placeholder="6"
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="review-frequency">Frequency</Label>
              <Input
                id="review-frequency"
                value={frequency}
                onChange={(event) => setFrequency(event.target.value)}
                placeholder="e.g. daily, 2x/week"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Effectiveness</Label>
              <div className="mt-2 flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setEffectivenessRating(rating)}
                    className="rounded-md p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label={`Rate ${rating} out of 5`}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        rating <= effectivenessRating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-sm text-muted-foreground">
                  {effectivenessRating > 0 ? `${effectivenessRating}/5` : 'Optional'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Benefits Experienced</Label>
              {benefitsExperienced.map((benefit, index) => (
                <div key={`${benefit}-${index}`} className="flex gap-2">
                  <Input
                    value={benefit}
                    onChange={(event) => updateListItem(setBenefitsExperienced, benefitsExperienced, index, event.target.value)}
                    placeholder="e.g. sleep improved, faster recovery"
                  />
                  {benefitsExperienced.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setBenefitsExperienced(benefitsExperienced.filter((_, itemIndex) => itemIndex !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setBenefitsExperienced([...benefitsExperienced, ''])}>
                <Plus className="mr-2 h-4 w-4" />
                Add Benefit
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Side Effects</Label>
              {sideEffects.map((effect, index) => (
                <div key={`${effect}-${index}`} className="flex gap-2">
                  <Input
                    value={effect}
                    onChange={(event) => updateListItem(setSideEffects, sideEffects, index, event.target.value)}
                    placeholder="Optional"
                  />
                  {sideEffects.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSideEffects(sideEffects.filter((_, itemIndex) => itemIndex !== index))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setSideEffects([...sideEffects, ''])}>
                <Plus className="mr-2 h-4 w-4" />
                Add Side Effect
              </Button>
            </div>

            <div>
              <Label htmlFor="review-notes">Notes</Label>
              <textarea
                id="review-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="What stood out, what changed, and what would you want another anon reader to know?"
                className="mt-2 flex min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Publishing...' : 'Publish Review'}
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
