'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ThumbsUp, ThumbsDown, Users, Eye, TrendingUp } from 'lucide-react';
import type { CommunityPeptide } from './CommunityView';

interface CommunityBrowserProps {
  onSelectPeptide: (peptide: CommunityPeptide) => void;
  onSubmitNew: () => void;
  onDatabaseError?: () => void;
}

export default function CommunityBrowser({ onSelectPeptide, onSubmitNew, onDatabaseError }: CommunityBrowserProps) {
  const [peptides, setPeptides] = useState<CommunityPeptide[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('upvotes');

  const loadPeptides = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sortBy,
        ...(search && { search }),
      });

      const response = await fetch(`/api/peptides?${params}`);
      const data = await response.json();

      // Check if database is configured
      if (data.configured === false && onDatabaseError) {
        onDatabaseError();
        return;
      }

      if (data.peptides) {
        setPeptides(data.peptides);
      }
    } catch (error) {
      console.error('Error loading peptides:', error);
      if (onDatabaseError) {
        onDatabaseError();
      }
    } finally {
      setLoading(false);
    }
  }, [onDatabaseError, search, sortBy]);

  useEffect(() => {
    void loadPeptides();
  }, [loadPeptides]);

  const handleVote = async (peptideId: string, voteType: 'upvote' | 'downvote') => {
    try {
      await fetch(`/api/peptides/${peptideId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: voteType }),
      });

      // Reload peptides to get updated vote counts
      loadPeptides();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Peptide Database
              </CardTitle>
              <CardDescription>
                Browse peptides submitted by the community. Data is user-contributed.
              </CardDescription>
            </div>
            <Button onClick={onSubmitNew}>
              Submit Peptide
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search peptides..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="upvotes">Most Popular</option>
              <option value="created_at">Recently Added</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>

          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-900 dark:text-yellow-200">
              <strong>User-Contributed Data:</strong> Information shown here is submitted by community members and may not be medically verified. Always consult healthcare professionals.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Peptide List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white" />
        </div>
      ) : peptides.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {search ? 'No peptides found matching your search.' : 'No peptides in the database yet.'}
            </p>
            <Button onClick={onSubmitNew}>Be the First to Submit</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {peptides.map((peptide) => (
            <Card
              key={peptide.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onSelectPeptide(peptide)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{peptide.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {peptide.description || 'No description available'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    {peptide.upvotes - peptide.downvotes}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Dosage Range */}
                {peptide.common_dosage_min && peptide.common_dosage_max && (
                  <div className="text-sm">
                    <span className="font-semibold">Common Range:</span>{' '}
                    {peptide.common_dosage_min}-{peptide.common_dosage_max}{' '}
                    {peptide.common_dosage_unit}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {peptide.submission_count} {peptide.submission_count === 1 ? 'submission' : 'submissions'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    View details
                  </div>
                </div>

                {/* Voting */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVote(peptide.id, 'upvote');
                    }}
                    className="flex items-center gap-1"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    {peptide.upvotes}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVote(peptide.id, 'downvote');
                    }}
                    className="flex items-center gap-1"
                  >
                    <ThumbsDown className="w-3 h-3" />
                    {peptide.downvotes}
                  </Button>
                  <div className="text-xs text-muted-foreground ml-auto">
                    First by: {peptide.submitted_by}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
