'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { addPeptide } from '@/lib/db';

interface AddPeptideProps {
  onBack: () => void;
}

export default function AddPeptide({ onBack }: AddPeptideProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minDosage, setMinDosage] = useState('');
  const [maxDosage, setMaxDosage] = useState('');
  const [dosageUnit, setDosageUnit] = useState<'mcg' | 'mg'>('mcg');
  const [benefits, setBenefits] = useState<string[]>(['']);
  const [contraindications, setContraindications] = useState<string[]>(['']);
  const [warnings, setWarnings] = useState<string[]>(['']);
  const [storageInstructions, setStorageInstructions] = useState('Refrigerate at 2-8°C after reconstitution');
  const [unreconShelfLife, setUnreconShelfLife] = useState('Store in freezer until use');
  const [reconShelfLife, setReconShelfLife] = useState('4-6 weeks when refrigerated');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addPeptide({
        name,
        description: description || undefined,
        commonDosageRange: minDosage && maxDosage ? {
          min: parseFloat(minDosage),
          max: parseFloat(maxDosage),
          unit: dosageUnit,
        } : undefined,
        benefits: benefits.filter(b => b.trim()),
        contraindications: contraindications.filter(c => c.trim()),
        warnings: warnings.filter(w => w.trim()),
        storageInstructions: storageInstructions || undefined,
        shelfLife: {
          unreconstituted: unreconShelfLife,
          reconstituted: reconShelfLife,
        },
      });

      onBack();
    } catch (error) {
      console.error('Error adding peptide:', error);
      alert('Failed to add peptide. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add New Peptide</CardTitle>
          <CardDescription>
            Create a custom peptide entry with dosing information and safety guidelines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Peptide Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., BPC-157, TB-500, CJC-1295"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the peptide"
                />
              </div>
            </div>

            {/* Dosage Range */}
            <div className="space-y-4">
              <h3 className="font-semibold">Common Dosage Range (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="minDosage">Minimum</Label>
                  <Input
                    id="minDosage"
                    type="number"
                    step="0.01"
                    value={minDosage}
                    onChange={(e) => setMinDosage(e.target.value)}
                    placeholder="200"
                  />
                </div>
                <div>
                  <Label htmlFor="maxDosage">Maximum</Label>
                  <Input
                    id="maxDosage"
                    type="number"
                    step="0.01"
                    value={maxDosage}
                    onChange={(e) => setMaxDosage(e.target.value)}
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
                    placeholder="e.g., Do not mix with other peptides in same vial"
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

            {/* Storage */}
            <div className="space-y-4">
              <h3 className="font-semibold">Storage Information</h3>
              <div>
                <Label htmlFor="storage">Storage Instructions</Label>
                <Input
                  id="storage"
                  value={storageInstructions}
                  onChange={(e) => setStorageInstructions(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unreconShelfLife">Unreconstituted Shelf Life</Label>
                  <Input
                    id="unreconShelfLife"
                    value={unreconShelfLife}
                    onChange={(e) => setUnreconShelfLife(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="reconShelfLife">Reconstituted Shelf Life</Label>
                  <Input
                    id="reconShelfLife"
                    value={reconShelfLife}
                    onChange={(e) => setReconShelfLife(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading || !name}>
                {loading ? 'Adding...' : 'Add Peptide'}
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
