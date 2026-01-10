import { PrismaClient } from '@prisma/client';

// Prevent multiple Prisma Client instances in development
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// Check if database is configured
export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);

// Types for API responses (matching the frontend expectations)
export interface CommunityPeptideResponse {
    id: string;
    name: string;
    description: string | null;
    submitted_by: string;
    submission_count: number;
    common_dosage_min: number | null;
    common_dosage_max: number | null;
    common_dosage_unit: string | null;
    benefits: string[];
    contraindications: string[];
    warnings: string[];
    storage_instructions: string | null;
    unreconstituted_shelf_life: string | null;
    reconstituted_shelf_life: string | null;
    upvotes: number;
    downvotes: number;
    created_at: string;
    updated_at: string;
}

// Transform Prisma model to API response format
export function transformPeptideResponse(peptide: {
    id: string;
    name: string;
    description: string | null;
    submittedBy: string;
    submissionCount: number;
    commonDosageMin: number | null;
    commonDosageMax: number | null;
    commonDosageUnit: string | null;
    benefits: string[];
    contraindications: string[];
    warnings: string[];
    storageInstructions: string | null;
    unreconstitutedShelfLife: string | null;
    reconstitutedShelfLife: string | null;
    upvotes: number;
    downvotes: number;
    createdAt: Date;
    updatedAt: Date;
}): CommunityPeptideResponse {
    return {
        id: peptide.id,
        name: peptide.name,
        description: peptide.description,
        submitted_by: peptide.submittedBy,
        submission_count: peptide.submissionCount,
        common_dosage_min: peptide.commonDosageMin,
        common_dosage_max: peptide.commonDosageMax,
        common_dosage_unit: peptide.commonDosageUnit,
        benefits: peptide.benefits || [],
        contraindications: peptide.contraindications || [],
        warnings: peptide.warnings || [],
        storage_instructions: peptide.storageInstructions,
        unreconstituted_shelf_life: peptide.unreconstitutedShelfLife,
        reconstituted_shelf_life: peptide.reconstitutedShelfLife,
        upvotes: peptide.upvotes,
        downvotes: peptide.downvotes,
        created_at: peptide.createdAt.toISOString(),
        updated_at: peptide.updatedAt.toISOString(),
    };
}

export default prisma;
