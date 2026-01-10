import { NextRequest, NextResponse } from 'next/server';
import prisma, { isDatabaseConfigured } from '@/lib/db-postgres';

// GET - Fetch reviews for a specific peptide
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured) {
    return NextResponse.json({ reviews: [], count: 0 });
  }

  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get('sortBy') || 'helpful_votes';

    // Build orderBy clause
    let orderBy: any = { helpfulVotes: 'desc' };
    if (sortBy === 'created_at') {
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === 'effectiveness_rating') {
      orderBy = { effectivenessRating: 'desc' };
    }

    const reviews = await prisma.userReview.findMany({
      where: { communityPeptideId: id },
      orderBy,
    });

    // Transform to match expected API format
    const transformedReviews = reviews.map((review) => ({
      id: review.id,
      peptide_id: review.communityPeptideId,
      peptide_name: review.peptideName,
      username: review.username,
      dosage_used: review.dosageUsed,
      dosage_unit: review.dosageUnit,
      frequency: review.frequency,
      duration_weeks: review.durationWeeks,
      benefits_experienced: review.benefitsExperienced,
      side_effects: review.sideEffects,
      effectiveness_rating: review.effectivenessRating,
      notes: review.notes,
      helpful_votes: review.helpfulVotes,
      created_at: review.createdAt.toISOString(),
      updated_at: review.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      reviews: transformedReviews,
      count: transformedReviews.length,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews', details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Submit a review for a peptide
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      username,
      peptide_name,
      dosage_used,
      dosage_unit,
      frequency,
      duration_weeks,
      benefits_experienced,
      side_effects,
      effectiveness_rating,
      notes,
    } = body;

    if (!username || !peptide_name) {
      return NextResponse.json(
        { error: 'Username and peptide name are required' },
        { status: 400 }
      );
    }

    const review = await prisma.userReview.create({
      data: {
        communityPeptideId: id,
        peptideName: peptide_name,
        username,
        dosageUsed: dosage_used,
        dosageUnit: dosage_unit,
        frequency,
        durationWeeks: duration_weeks,
        benefitsExperienced: benefits_experienced || [],
        sideEffects: side_effects || [],
        effectivenessRating: effectiveness_rating,
        notes,
      },
    });

    return NextResponse.json({
      message: 'Review submitted successfully',
      review: {
        id: review.id,
        peptide_id: review.communityPeptideId,
        peptide_name: review.peptideName,
        username: review.username,
        created_at: review.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review', details: String(error) },
      { status: 500 }
    );
  }
}
