'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Server } from 'lucide-react';
import CommunityBrowser from './CommunityBrowser';
import PeptideDetail from './PeptideDetail';
import SubmitPeptideForm from './SubmitPeptideForm';
import SubmitReviewForm from './SubmitReviewForm';
import { addPeptide } from '@/lib/db';

// Types for community peptides (matching API response)
export interface CommunityPeptide {
  id: string;
  name: string;
  description?: string | null;
  submitted_by: string;
  submission_count: number;
  common_dosage_min?: number | null;
  common_dosage_max?: number | null;
  common_dosage_unit?: string | null;
  benefits?: string[];
  contraindications?: string[];
  warnings?: string[];
  storage_instructions?: string | null;
  unreconstituted_shelf_life?: string | null;
  reconstituted_shelf_life?: string | null;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
}

type CommunityViewMode = 'browse' | 'detail' | 'submit' | 'review';

interface DatabaseStatus {
  configured: boolean;
  loading: boolean;
}

export default function CommunityView() {
  const [viewMode, setViewMode] = useState<CommunityViewMode>('browse');
  const [selectedPeptide, setSelectedPeptide] = useState<CommunityPeptide | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({ configured: true, loading: false });

  // Check database status on first API call (handled in CommunityBrowser)
  const handleDatabaseNotConfigured = () => {
    setDbStatus({ configured: false, loading: false });
  };

  // If database isn't configured, show setup message
  if (!dbStatus.configured) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Community Unavailable
          </CardTitle>
          <CardDescription>
            Threads and shared peptide data are unavailable right now
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Personal tracking still works locally on this device. Community features come back automatically when shared data is available again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSelectPeptide = (peptide: CommunityPeptide) => {
    setSelectedPeptide(peptide);
    setViewMode('detail');
  };

  const handleUseInApp = async (peptide: CommunityPeptide) => {
    try {
      await addPeptide({
        name: peptide.name,
        description: peptide.description || undefined,
        commonDosageRange: peptide.common_dosage_min && peptide.common_dosage_max ? {
          min: peptide.common_dosage_min,
          max: peptide.common_dosage_max,
          unit: (peptide.common_dosage_unit as 'mcg' | 'mg') || 'mcg',
        } : undefined,
        benefits: peptide.benefits || undefined,
        contraindications: peptide.contraindications || undefined,
        warnings: peptide.warnings || undefined,
        storageInstructions: peptide.storage_instructions || undefined,
        shelfLife: {
          unreconstituted: peptide.unreconstituted_shelf_life || 'Store in freezer',
          reconstituted: peptide.reconstituted_shelf_life || '4-6 weeks refrigerated',
        },
      });

      alert(`${peptide.name} has been added to your personal peptide library!`);
      setViewMode('browse');
    } catch (error) {
      console.error('Error adding peptide:', error);
      alert('Failed to add peptide to your library. It may already exist.');
    }
  };

  return (
    <div>
      {viewMode === 'browse' && (
        <CommunityBrowser
          onSelectPeptide={handleSelectPeptide}
          onSubmitNew={() => setViewMode('submit')}
          onDatabaseError={handleDatabaseNotConfigured}
        />
      )}

      {viewMode === 'detail' && selectedPeptide && (
        <PeptideDetail
          peptide={selectedPeptide}
          onBack={() => setViewMode('browse')}
          onAddReview={(peptide) => {
            setSelectedPeptide(peptide);
            setViewMode('review');
          }}
          onUseInApp={handleUseInApp}
        />
      )}

      {viewMode === 'submit' && (
        <SubmitPeptideForm
          onBack={() => setViewMode('browse')}
          onSuccess={() => setViewMode('browse')}
        />
      )}

      {viewMode === 'review' && selectedPeptide && (
        <SubmitReviewForm
          peptide={selectedPeptide}
          onBack={() => setViewMode('detail')}
          onSuccess={() => setViewMode('detail')}
        />
      )}
    </div>
  );
}
