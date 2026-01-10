import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '');

// Create client with dummy values if not configured (prevents errors)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

// Types for community peptides
export interface CommunityPeptide {
  id: string;
  name: string;
  description?: string;
  submitted_by: string; // username/alias
  submission_count: number; // number of users who submitted this peptide
  common_dosage_min?: number;
  common_dosage_max?: number;
  common_dosage_unit?: 'mcg' | 'mg';
  benefits?: string[];
  contraindications?: string[];
  warnings?: string[];
  storage_instructions?: string;
  unreconstituted_shelf_life?: string;
  reconstituted_shelf_life?: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
}

export interface UserReview {
  id: string;
  peptide_id: string;
  peptide_name: string;
  username: string;
  dosage_used?: number;
  dosage_unit?: 'mcg' | 'mg';
  frequency?: string;
  duration_weeks?: number;
  benefits_experienced?: string[];
  side_effects?: string[];
  effectiveness_rating?: number; // 1-5 stars
  notes?: string;
  helpful_votes: number;
  created_at: string;
  updated_at: string;
}

export interface PeptideSubmission {
  id: string;
  peptide_name: string;
  submitted_by: string;
  description?: string;
  dosage_min?: number;
  dosage_max?: number;
  dosage_unit?: 'mcg' | 'mg';
  benefits?: string[];
  contraindications?: string[];
  warnings?: string[];
  notes?: string;
  source?: string; // e.g., "personal experience", "clinical study", etc.
  created_at: string;
}
