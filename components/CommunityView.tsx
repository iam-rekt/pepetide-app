'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, ExternalLink, Server } from 'lucide-react';
import CommunityBrowser from './CommunityBrowser';
import PeptideDetail from './PeptideDetail';
import SubmitPeptideForm from './SubmitPeptideForm';
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
            Database Not Connected
          </CardTitle>
          <CardDescription>
            Connect a PostgreSQL database to enable community features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The community peptide database requires a PostgreSQL database (we recommend Railway). This allows users to share peptide information anonymously.
          </p>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold mb-2">Quick Setup with Railway (5 minutes)</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Create a free Railway account at railway.app</li>
              <li>Create a new PostgreSQL database</li>
              <li>Copy the DATABASE_URL connection string</li>
              <li>Add it to your .env file</li>
              <li>Run <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">npx prisma migrate dev</code></li>
              <li>Restart the dev server</li>
            </ol>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <a href="https://railway.app" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Get Started with Railway
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Don't want community features? All personal tracking features work without a database connection.
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
        <div>
          {/* Review form would go here - simplified for now */}
          <p>Review form coming soon</p>
          <button onClick={() => setViewMode('detail')}>Back to Detail</button>
        </div>
      )}
    </div>
  );
}
