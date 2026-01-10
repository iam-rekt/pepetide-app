'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator as CalcIcon, Beaker, Droplet, Syringe } from 'lucide-react';
import { calculateReconstitution, getRecommendedBacteriostaticWater } from '@/lib/calculator';
import type { ReconstitutionCalculation } from '@/types';

export default function Calculator() {
  const [vialSize, setVialSize] = useState('');
  const [vialSizeUnit, setVialSizeUnit] = useState<'mg' | 'mcg'>('mg');
  const [bacteriostaticWater, setBacteriostaticWater] = useState('');
  const [targetDose, setTargetDose] = useState('');
  const [targetDoseUnit, setTargetDoseUnit] = useState<'mcg' | 'mg'>('mcg');
  const [result, setResult] = useState<ReconstitutionCalculation | null>(null);

  const handleCalculate = () => {
    if (!vialSize || !bacteriostaticWater || !targetDose) {
      alert('Please fill in all fields');
      return;
    }

    const calculation = calculateReconstitution(
      parseFloat(vialSize),
      vialSizeUnit,
      parseFloat(bacteriostaticWater),
      parseFloat(targetDose),
      targetDoseUnit
    );

    setResult(calculation);
  };

  const handleReset = () => {
    setVialSize('');
    setBacteriostaticWater('');
    setTargetDose('');
    setResult(null);
  };

  const recommendations = vialSize
    ? getRecommendedBacteriostaticWater(parseFloat(vialSize), vialSizeUnit)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalcIcon className="w-5 h-5" />
            Reconstitution Calculator
          </CardTitle>
          <CardDescription>
            Calculate exact dosing volumes for peptide reconstitution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vial Size */}
          <div className="space-y-2">
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

          {/* Bacteriostatic Water */}
          <div className="space-y-2">
            <Label htmlFor="bacteriostaticWater">Bacteriostatic Water (mL)</Label>
            <Input
              id="bacteriostaticWater"
              type="number"
              step="0.1"
              value={bacteriostaticWater}
              onChange={(e) => setBacteriostaticWater(e.target.value)}
              placeholder="2.0"
            />
            {recommendations.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Recommended: {recommendations.join(' mL, ')} mL for easier calculations
              </div>
            )}
          </div>

          {/* Target Dose */}
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
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCalculate} className="flex-1">
              Calculate
            </Button>
            <Button onClick={handleReset} variant="outline">
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <Card className="bg-white/5 dark:bg-slate-900/5 backdrop-blur-sm border-white/20 dark:border-blue-800/30">
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Your reconstitution calculations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Concentration */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Beaker className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Concentration</div>
                <div className="text-2xl font-bold">
                  {result.concentration.toFixed(2)} {result.concentrationUnit}
                </div>
              </div>
            </div>

            {/* Volume Per Dose */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Droplet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Volume Per Dose</div>
                <div className="text-2xl font-bold">{result.volumePerDose.toFixed(3)} mL</div>
              </div>
            </div>

            {/* Syringe Units */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <Syringe className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Units on U-100 Insulin Syringe</div>
                <div className="text-2xl font-bold">{result.unitsOnSyringe.toFixed(1)} units</div>
              </div>
            </div>

            {/* Total Doses */}
            <div className="p-4 rounded-lg bg-white/5 dark:bg-black/5 border border-white/20 dark:border-blue-800/30">
              <div className="text-sm text-muted-foreground mb-1">Total Doses in Vial</div>
              <div className="text-xl font-semibold">{result.totalDoses} doses</div>
              <div className="text-xs text-muted-foreground mt-1">
                at {result.targetDose} {result.targetDoseUnit} per dose
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2 text-sm">
              <div className="font-semibold">How to Use:</div>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Add {result.bacteriostaticWater} mL bacteriostatic water to the vial</li>
                <li>Swirl gently until fully dissolved (do not shake)</li>
                <li>Draw {result.unitsOnSyringe.toFixed(1)} units on insulin syringe for each dose</li>
                <li>Store refrigerated at 2-8°C, use within 4-6 weeks</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Educational Info */}
      {!result && (
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              This calculator helps you determine the exact volume to draw for each peptide dose after
              reconstitution with bacteriostatic water.
            </p>
            <div className="space-y-2">
              <div className="font-semibold text-foreground">Formula:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Concentration = Vial Size ÷ Bacteriostatic Water</li>
                <li>Volume Per Dose = Target Dose ÷ Concentration</li>
                <li>Syringe Units = Volume × 100 (for U-100 syringes)</li>
              </ul>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-md border border-orange-200 dark:border-orange-800">
              <p className="font-semibold text-orange-900 dark:text-orange-200">
                Safety Reminder:
              </p>
              <p className="text-orange-800 dark:text-orange-300 text-xs mt-1">
                Always verify calculations independently. Consult with a healthcare provider before
                starting any peptide protocol. This tool is for educational purposes only.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
