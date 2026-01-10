import { NextRequest, NextResponse } from 'next/server';
import prisma, { isDatabaseConfigured } from '@/lib/db-postgres';

// GET - Fetch all submissions for a specific peptide
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured) {
    return NextResponse.json({ submissions: [], count: 0 });
  }

  try {
    const { id } = await params;

    // Get the peptide
    const peptide = await prisma.communityPeptide.findUnique({
      where: { id },
      select: { name: true },
    });

    if (!peptide) {
      return NextResponse.json(
        { error: 'Peptide not found' },
        { status: 404 }
      );
    }

    // Get all submissions for this peptide
    const submissions = await prisma.peptideSubmission.findMany({
      where: { communityPeptideId: id },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to match expected API format
    const transformedSubmissions = submissions.map((sub) => ({
      id: sub.id,
      peptide_name: sub.peptideName,
      submitted_by: sub.submittedBy,
      description: sub.description,
      dosage_min: sub.dosageMin,
      dosage_max: sub.dosageMax,
      dosage_unit: sub.dosageUnit,
      benefits: sub.benefits,
      contraindications: sub.contraindications,
      warnings: sub.warnings,
      notes: sub.notes,
      source: sub.source,
      created_at: sub.createdAt.toISOString(),
    }));

    return NextResponse.json({
      peptide_name: peptide.name,
      submissions: transformedSubmissions,
      count: transformedSubmissions.length,
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions', details: String(error) },
      { status: 500 }
    );
  }
}
