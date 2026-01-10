'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, MessageSquare, Star, ThumbsUp } from 'lucide-react';
import type { CommunityPeptide } from './CommunityView';
import { format } from 'date-fns';

// Types for API responses
interface UserReview {
  id: string;
  peptide_id: string | null;
  peptide_name: string;
  username: string;
  dosage_used: number | null;
  dosage_unit: string | null;
  frequency: string | null;
  duration_weeks: number | null;
  benefits_experienced: string[];
  side_effects: string[];
  effectiveness_rating: number | null;
  notes: string | null;
  helpful_votes: number;
  created_at: string;
  updated_at: string;
}

interface PeptideSubmission {
  id: string;
  peptide_name: string;
  submitted_by: string;
  description: string | null;
  dosage_min: number | null;
  dosage_max: number | null;
  dosage_unit: string | null;
  benefits: string[];
  contraindications: string[];
  warnings: string[];
  notes: string | null;
  source: string | null;
  created_at: string;
}

interface PeptideDetailProps {
  peptide: CommunityPeptide;
  onBack: () => void;
  onAddReview: (peptide: CommunityPeptide) => void;
  onUseInApp: (peptide: CommunityPeptide) => void;
}

export default function PeptideDetail({ peptide, onBack, onAddReview, onUseInApp }: PeptideDetailProps) {
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [submissions, setSubmissions] = useState<PeptideSubmission[]>([]);
  const [viewMode, setViewMode] = useState<'overview' | 'reviews' | 'submissions'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [peptide.id]);

  async function loadData() {
    setLoading(true);
    try {
      const [reviewsRes, submissionsRes] = await Promise.all([
        fetch(`/api/peptides/${peptide.id}/reviews`),
        fetch(`/api/peptides/${peptide.id}/submissions`),
      ]);

      const [reviewsData, submissionsData] = await Promise.all([
        reviewsRes.json(),
        submissionsRes.json(),
      ]);

      setReviews(reviewsData.reviews || []);
      setSubmissions(submissionsData.submissions || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.effectiveness_rating || 0), 0) / reviews.filter(r => r.effectiveness_rating).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold">{peptide.name}</h2>
          <p className="text-muted-foreground mt-1">{peptide.description}</p>
        </div>
        <Button onClick={() => onUseInApp(peptide)}>
          Add to My Peptides
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={viewMode === 'overview' ? 'default' : 'ghost'}
          onClick={() => setViewMode('overview')}
          className="rounded-b-none"
        >
          Overview
        </Button>
        <Button
          variant={viewMode === 'reviews' ? 'default' : 'ghost'}
          onClick={() => setViewMode('reviews')}
          className="rounded-b-none"
        >
          Reviews ({reviews.length})
        </Button>
        <Button
          variant={viewMode === 'submissions' ? 'default' : 'ghost'}
          onClick={() => setViewMode('submissions')}
          className="rounded-b-none"
        >
          User Submissions ({submissions.length})
        </Button>
      </div>

      {/* Overview Tab */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Dosage Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {peptide.common_dosage_min && peptide.common_dosage_max ? (
                <div>
                  <div className="font-semibold text-sm text-muted-foreground">Common Range</div>
                  <div className="text-2xl font-bold">
                    {peptide.common_dosage_min}-{peptide.common_dosage_max} {peptide.common_dosage_unit}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No dosage information available</p>
              )}

              {avgRating > 0 && (
                <div className="pt-3 border-t">
                  <div className="font-semibold text-sm text-muted-foreground">Average Effectiveness</div>
                  <div className="flex items-center gap-2 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${star <= avgRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                          }`}
                      />
                    ))}
                    <span className="text-sm text-muted-foreground">
                      {avgRating.toFixed(1)} ({reviews.filter(r => r.effectiveness_rating).length} ratings)
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {peptide.benefits && peptide.benefits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {peptide.benefits.map((benefit, i) => (
                    <li key={i} className="text-sm">{benefit}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {peptide.contraindications && peptide.contraindications.length > 0 && (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Contraindications</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {peptide.contraindications.map((contra, i) => (
                    <li key={i} className="text-sm">{contra}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {peptide.warnings && peptide.warnings.length > 0 && (
            <Card className="border-orange-200 dark:border-orange-900">
              <CardHeader>
                <CardTitle className="text-orange-600 dark:text-orange-400">Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {peptide.warnings.map((warning, i) => (
                    <li key={i} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Storage & Shelf Life</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {peptide.storage_instructions && (
                <div>
                  <span className="font-semibold">Storage:</span> {peptide.storage_instructions}
                </div>
              )}
              {peptide.unreconstituted_shelf_life && (
                <div>
                  <span className="font-semibold">Unreconstituted:</span> {peptide.unreconstituted_shelf_life}
                </div>
              )}
              {peptide.reconstituted_shelf_life && (
                <div>
                  <span className="font-semibold">Reconstituted:</span> {peptide.reconstituted_shelf_life}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Community Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Submissions
                </span>
                <span className="font-semibold">{peptide.submission_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Reviews
                </span>
                <span className="font-semibold">{reviews.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4" />
                  Net Votes
                </span>
                <span className="font-semibold">{peptide.upvotes - peptide.downvotes}</span>
              </div>
              <div className="text-xs text-muted-foreground pt-2 border-t">
                First submitted by: {peptide.submitted_by}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reviews Tab */}
      {viewMode === 'reviews' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">User Reviews</h3>
            <Button onClick={() => onAddReview(peptide)}>
              Write a Review
            </Button>
          </div>

          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No reviews yet</p>
                <Button onClick={() => onAddReview(peptide)}>Be the First to Review</Button>
              </CardContent>
            </Card>
          ) : (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{review.username}</CardTitle>
                      <CardDescription>
                        {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </CardDescription>
                    </div>
                    {review.effectiveness_rating && (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= review.effectiveness_rating!
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                              }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {review.dosage_used && (
                    <div className="text-sm">
                      <span className="font-semibold">Dosage Used:</span> {review.dosage_used} {review.dosage_unit}
                      {review.frequency && ` • ${review.frequency}`}
                      {review.duration_weeks && ` • ${review.duration_weeks} weeks`}
                    </div>
                  )}

                  {review.benefits_experienced && review.benefits_experienced.length > 0 && (
                    <div>
                      <div className="font-semibold text-sm text-green-600 dark:text-green-400">
                        Benefits Experienced:
                      </div>
                      <ul className="list-disc list-inside text-sm mt-1">
                        {review.benefits_experienced.map((benefit, i) => (
                          <li key={i}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {review.side_effects && review.side_effects.length > 0 && (
                    <div>
                      <div className="font-semibold text-sm text-orange-600 dark:text-orange-400">
                        Side Effects:
                      </div>
                      <ul className="list-disc list-inside text-sm mt-1">
                        {review.side_effects.map((effect, i) => (
                          <li key={i}>{effect}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {review.notes && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md text-sm">
                      {review.notes}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                    <ThumbsUp className="w-3 h-3" />
                    {review.helpful_votes} found this helpful
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Submissions Tab */}
      {viewMode === 'submissions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold">Individual User Submissions</h3>
              <p className="text-sm text-muted-foreground">
                View all submissions from different users for {peptide.name}
              </p>
            </div>
          </div>

          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">Submitted by: {submission.submitted_by}</CardTitle>
                    <CardDescription>
                      {format(new Date(submission.created_at), 'MMM d, yyyy')}
                      {submission.source && ` • Source: ${submission.source}`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {submission.description && (
                  <p className="text-sm">{submission.description}</p>
                )}

                {submission.dosage_min && submission.dosage_max && (
                  <div className="text-sm">
                    <span className="font-semibold">Suggested Range:</span>{' '}
                    {submission.dosage_min}-{submission.dosage_max} {submission.dosage_unit}
                  </div>
                )}

                {submission.benefits && submission.benefits.length > 0 && (
                  <div>
                    <div className="font-semibold text-sm">Benefits:</div>
                    <ul className="list-disc list-inside text-sm mt-1">
                      {submission.benefits.map((benefit, i) => (
                        <li key={i}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {submission.notes && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md text-sm">
                    <div className="font-semibold mb-1">Notes:</div>
                    {submission.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
