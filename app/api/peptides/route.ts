import { NextRequest, NextResponse } from 'next/server';
import prisma, { transformPeptideResponse, isDatabaseConfigured } from '@/lib/db-postgres';

// GET - Fetch all community peptides with optional filters
export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured) {
    return NextResponse.json({ peptides: [], count: 0, configured: false });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'upvotes';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where = search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {};

    // Build orderBy clause
    let orderBy: any = { upvotes: 'desc' };
    if (sortBy === 'created_at') {
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === 'name') {
      orderBy = { name: 'asc' };
    }

    const peptides = await prisma.communityPeptide.findMany({
      where,
      orderBy,
      take: limit,
    });

    const transformedPeptides = peptides.map(transformPeptideResponse);

    return NextResponse.json({
      peptides: transformedPeptides,
      count: transformedPeptides.length,
      configured: true,
    });
  } catch (error) {
    console.error('Error fetching peptides:', error);
    return NextResponse.json(
      { error: 'Failed to fetch peptides', details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Submit a new peptide or add to existing
export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const {
      name,
      username,
      description,
      dosage_min,
      dosage_max,
      dosage_unit,
      benefits,
      contraindications,
      warnings,
      storage_instructions,
      unreconstituted_shelf_life,
      reconstituted_shelf_life,
      notes,
      source,
    } = body;

    if (!name || !username) {
      return NextResponse.json(
        { error: 'Name and username are required' },
        { status: 400 }
      );
    }

    // Check if peptide already exists
    const existing = await prisma.communityPeptide.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (existing) {
      // Create submission and update peptide
      const [submission, updated] = await prisma.$transaction([
        prisma.peptideSubmission.create({
          data: {
            peptideName: name,
            submittedBy: username,
            description,
            dosageMin: dosage_min,
            dosageMax: dosage_max,
            dosageUnit: dosage_unit,
            benefits: benefits || [],
            contraindications: contraindications || [],
            warnings: warnings || [],
            notes,
            source,
            communityPeptideId: existing.id,
          },
        }),
        prisma.communityPeptide.update({
          where: { id: existing.id },
          data: { submissionCount: { increment: 1 } },
        }),
      ]);

      return NextResponse.json({
        message: 'Submission added to existing peptide',
        peptide: transformPeptideResponse(updated),
        submission,
        isNew: false,
      });
    } else {
      // Create new peptide and submission
      const newPeptide = await prisma.communityPeptide.create({
        data: {
          name,
          description,
          submittedBy: username,
          submissionCount: 1,
          commonDosageMin: dosage_min,
          commonDosageMax: dosage_max,
          commonDosageUnit: dosage_unit,
          benefits: benefits || [],
          contraindications: contraindications || [],
          warnings: warnings || [],
          storageInstructions: storage_instructions,
          unreconstitutedShelfLife: unreconstituted_shelf_life,
          reconstitutedShelfLife: reconstituted_shelf_life,
        },
      });

      const submission = await prisma.peptideSubmission.create({
        data: {
          peptideName: name,
          submittedBy: username,
          description,
          dosageMin: dosage_min,
          dosageMax: dosage_max,
          dosageUnit: dosage_unit,
          benefits: benefits || [],
          contraindications: contraindications || [],
          warnings: warnings || [],
          notes,
          source,
          communityPeptideId: newPeptide.id,
        },
      });

      return NextResponse.json({
        message: 'New peptide created successfully',
        peptide: transformPeptideResponse(newPeptide),
        submission,
        isNew: true,
      });
    }
  } catch (error) {
    console.error('Error submitting peptide:', error);
    return NextResponse.json(
      { error: 'Failed to submit peptide', details: String(error) },
      { status: 500 }
    );
  }
}
