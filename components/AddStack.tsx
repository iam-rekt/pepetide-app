'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Check, Sparkles, Beaker, Calendar as CalendarIcon } from 'lucide-react';
import { addPeptide, addVial } from '@/lib/db';
import { calculateExpirationDate } from '@/lib/calculator';
import { format } from 'date-fns';

interface AddStackProps {
  onBack: () => void;
  onComplete: () => void;
}

type Step = 'peptide' | 'vial' | 'summary';

export default function AddStack({ onBack, onComplete }: AddStackProps) {
  const [step, setStep] = useState<Step>('peptide');
  const [loading, setLoading] = useState(false);

  // Peptide data
  const [peptideName, setPeptideName] = useState('');
  const [description, setDescription] = useState('');
  const [dosageMin, setDosageMin] = useState('');
  const [dosageMax, setDosageMax] = useState('');
  const [dosageUnit, setDosageUnit] = useState<'mcg' | 'mg'>('mcg');

  // Vial data
  const [vialSize, setVialSize] = useState('');
  const [vialSizeUnit, setVialSizeUnit] = useState<'mg' | 'mcg'>('mg');
  const [bacteriostaticWater, setBacteriostaticWater] = useState('');
  const [receivedDate, setReceivedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reconstitutedDate, setReconstitutedDate] = useState('');
  const [batchNumber, setBatchNumber] = useState('');

  const [createdPeptideId, setCreatedPeptideId] = useState('');

  const handlePeptideNext = async () => {
    if (!peptideName) {
      alert('Peptide name is required');
      return;
    }

    setLoading(true);
    try {
      const peptide = await addPeptide({
        name: peptideName,
        description: description || undefined,
        commonDosageRange: dosageMin && dosageMax ? {
          min: parseFloat(dosageMin),
          max: parseFloat(dosageMax),
          unit: dosageUnit,
        } : undefined,
      });

      setCreatedPeptideId(peptide.id);
      setStep('vial');
    } catch (error) {
      console.error('Error adding peptide:', error);
      alert('Failed to add peptide. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVialNext = async () => {
    if (!vialSize) {
      alert('Vial size is required');
      return;
    }

    setLoading(true);
    try {
      const reconDate = reconstitutedDate ? new Date(reconstitutedDate) : undefined;
      const expirationDate = reconDate ? calculateExpirationDate(reconDate, 6) : undefined;

      await addVial({
        peptideId: createdPeptideId,
        peptideName,
        vialSize: parseFloat(vialSize),
        vialSizeUnit,
        bacteriostaticWaterAdded: bacteriostaticWater ? parseFloat(bacteriostaticWater) : undefined,
        receivedDate: new Date(receivedDate),
        reconstitutedDate: reconDate,
        expirationDate,
        batchNumber: batchNumber || undefined,
        isActive: true,
      });

      setStep('summary');
    } catch (error) {
      console.error('Error adding vial:', error);
      alert('Failed to add vial. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = step === 'peptide' ? 33 : step === 'vial' ? 66 : 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with progress */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="relative overflow-hidden rounded-2xl bg-white/5 dark:bg-slate-950/5 border border-white/20 dark:border-slate-700/30 p-[3px] shadow-lg backdrop-blur-sm">
          <div className="relative overflow-hidden rounded-2xl p-8">
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/30">
                  <Sparkles className="w-6 h-6 text-white dark:text-slate-900" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                    Add New Stack
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Set up your peptide and first vial in one flow
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className={step === 'peptide' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-muted-foreground'}>
                    1. Peptide Info
                  </span>
                  <span className={step === 'vial' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-muted-foreground'}>
                    2. Vial Details
                  </span>
                  <span className={step === 'summary' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-muted-foreground'}>
                    3. Complete
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {/* Step 1: Peptide Info */}
        {step === 'peptide' && (
          <motion.div
            key="peptide"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border border-white/20 dark:border-blue-800/30 bg-white/5 dark:bg-slate-900/5 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Beaker className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Peptide Information
                </CardTitle>
                <CardDescription>
                  Tell us about the peptide you're adding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="peptideName" className="text-base font-semibold">
                    Peptide Name *
                  </Label>
                  <Input
                    id="peptideName"
                    value={peptideName}
                    onChange={(e) => setPeptideName(e.target.value)}
                    placeholder="e.g., BPC-157, TB-500, CJC-1295"
                    className="text-lg h-12"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-semibold">
                    Description (Optional)
                  </Label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the peptide..."
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Common Dosage Range (Optional)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dosageMin" className="text-sm">Minimum</Label>
                      <Input
                        id="dosageMin"
                        type="number"
                        step="0.01"
                        value={dosageMin}
                        onChange={(e) => setDosageMin(e.target.value)}
                        placeholder="200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dosageMax" className="text-sm">Maximum</Label>
                      <Input
                        id="dosageMax"
                        type="number"
                        step="0.01"
                        value={dosageMax}
                        onChange={(e) => setDosageMax(e.target.value)}
                        placeholder="500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dosageUnit" className="text-sm">Unit</Label>
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

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={handlePeptideNext}
                    disabled={loading || !peptideName}
                    className="flex-1 h-12 text-base bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/50 transition-all"
                  >
                    {loading ? 'Creating...' : 'Next: Add Vial'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Vial Details */}
        {step === 'vial' && (
          <motion.div
            key="vial"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border border-white/20 dark:border-purple-800/30 bg-white/5 dark:bg-slate-900/5 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Vial Details
                </CardTitle>
                <CardDescription>
                  Add your first {peptideName} vial
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="vialSize" className="text-base font-semibold">
                      Vial Size *
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="vialSize"
                        type="number"
                        step="0.01"
                        value={vialSize}
                        onChange={(e) => setVialSize(e.target.value)}
                        placeholder="5"
                        className="flex-1 h-12 text-lg"
                      />
                      <select
                        value={vialSizeUnit}
                        onChange={(e) => setVialSizeUnit(e.target.value as 'mg' | 'mcg')}
                        className="flex h-12 rounded-md border border-input bg-background px-3 py-2 text-sm w-24"
                      >
                        <option value="mg">mg</option>
                        <option value="mcg">mcg</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bacteriostaticWater" className="text-base font-semibold">
                      Bacteriostatic Water (mL)
                    </Label>
                    <Input
                      id="bacteriostaticWater"
                      type="number"
                      step="0.1"
                      value={bacteriostaticWater}
                      onChange={(e) => setBacteriostaticWater(e.target.value)}
                      placeholder="2.0"
                      className="h-12 text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receivedDate" className="text-base font-semibold">
                      Received Date
                    </Label>
                    <Input
                      id="receivedDate"
                      type="date"
                      value={receivedDate}
                      onChange={(e) => setReceivedDate(e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reconstitutedDate" className="text-base font-semibold">
                      Reconstituted Date
                    </Label>
                    <Input
                      id="reconstitutedDate"
                      type="date"
                      value={reconstitutedDate}
                      onChange={(e) => setReconstitutedDate(e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="batchNumber" className="text-base font-semibold">
                      Batch Number (Optional)
                    </Label>
                    <Input
                      id="batchNumber"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="e.g., BAT-2024-001"
                      className="h-12 text-lg"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={() => setStep('peptide')}
                    variant="outline"
                    className="h-12"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleVialNext}
                    disabled={loading || !vialSize}
                    className="flex-1 h-12 text-base bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 dark:from-slate-300 dark:to-slate-200 dark:hover:from-slate-200 dark:hover:to-slate-100 dark:text-slate-900"
                  >
                    {loading ? 'Creating...' : 'Complete Setup'}
                    <Check className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Summary */}
        {step === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border border-white/20 dark:border-slate-600/30 bg-white/5 dark:bg-slate-800/5 backdrop-blur-sm shadow-xl">
              <CardHeader className="text-center pb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-400 dark:to-slate-200 flex items-center justify-center shadow-lg"
                >
                  <Check className="w-10 h-10 text-white" />
                </motion.div>
                <CardTitle className="text-2xl">Stack Created Successfully!</CardTitle>
                <CardDescription className="text-base">
                  Your peptide and vial have been added to your library
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 dark:bg-slate-900/5 rounded-lg backdrop-blur-sm">
                    <div className="text-sm text-muted-foreground mb-1">Peptide</div>
                    <div className="font-semibold text-lg">{peptideName}</div>
                    {dosageMin && dosageMax && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {dosageMin}-{dosageMax} {dosageUnit}
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-white/5 dark:bg-slate-900/5 rounded-lg backdrop-blur-sm">
                    <div className="text-sm text-muted-foreground mb-1">Vial</div>
                    <div className="font-semibold text-lg">
                      {vialSize} {vialSizeUnit}
                    </div>
                    {bacteriostaticWater && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {bacteriostaticWater} mL water added
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg">
                  <div className="font-semibold text-sm text-blue-900 dark:text-blue-300">
                    What's Next?
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                      <span>Use the <strong>Calculator</strong> to determine exact dosing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                      <span>Build a <strong>Protocol</strong> to auto-schedule doses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                      <span>Track daily progress in your <strong>Calendar</strong></span>
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={onComplete}
                  className="w-full h-12 text-base bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black dark:from-slate-200 dark:to-slate-100 dark:hover:from-slate-100 dark:hover:to-white dark:text-slate-900"
                >
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
