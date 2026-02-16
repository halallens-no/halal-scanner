/** Halal status of an ingredient */
export type HalalStatus = 'HALAL' | 'HARAM' | 'MUSHBOOH' | 'UNKNOWN' | 'NOT_FOOD';

/** Data source for the status determination */
export type IngredientSource = 'database' | 'llm' | 'manual' | 'cache';

/** Scanner configuration options */
export interface ScannerOptions {
  /** API base URL. Defaults to https://halallens.no/api */
  baseUrl?: string;
  /** Device ID for usage tracking. Auto-generated if not provided. */
  deviceId?: string;
  /** Request timeout in milliseconds. Defaults to 10000. */
  timeout?: number;
}

// --- Search endpoint types ---

export interface SearchParams {
  /** Search query text */
  query: string;
  /** Filter by halal status */
  status?: HalalStatus;
  /** Filter by category */
  category?: string;
  /** Language code (ISO 639-1). Defaults to "en". */
  language?: string;
  /** Only return verified ingredients */
  verifiedOnly?: boolean;
  /** Only return E-numbers */
  eNumber?: boolean;
  /** Page number. Defaults to 1. */
  page?: number;
  /** Results per page. Defaults to 20, max 100. */
  perPage?: number;
}

export interface SearchResult {
  items: IngredientSummary[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
  language_matches: LanguageMatch[];
  fuzzy_suggestions: FuzzySuggestion[];
}

export interface IngredientSummary {
  id: number;
  name: string;
  category: string | null;
  language_code: string;
  halal_status: HalalStatus;
  display_status: string;
  status_verified: boolean;
  status_color: string;
  image_url: string | null;
  has_grounding: boolean;
  has_elaborated_explanation: boolean;
  is_gemini_enriched: boolean;
  ai_review: AIReviewSummary | null;
  similar_items: SimilarItem[];
}

export interface AIReviewSummary {
  ai_review_count: number;
  agreement_percentage: number;
  consensus_status: HalalStatus | null;
  consensus_confidence: number | null;
  analyzed_at: string | null;
  opinions: AIOpinion[];
  show_all_opinions: boolean;
}

export interface AIOpinion {
  halal_status: HalalStatus;
  confidence: number;
  explanation: string;
  food_source: string | null;
}

export interface SimilarItem {
  id: number;
  name: string;
  halal_status: HalalStatus;
  status_verified: boolean;
  status_color: string;
  ai_review_count: number;
}

export interface LanguageMatch {
  language_code: string;
  language_name: string;
  match_count: number;
}

export interface FuzzySuggestion {
  id: number;
  name: string;
  halal_status: HalalStatus;
  display_status: string;
  status_color: string;
  similarity: number;
}

// --- Check endpoint types ---

export interface IngredientDetail extends IngredientSummary {
  explanation: string | null;
  food_source: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  translations: IngredientTranslation[];
  explanation_language: string;
  translation_available: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface IngredientTranslation {
  language_code: string;
  translated_name: string;
  is_validated: boolean;
}

// --- Analyze endpoint types ---

export interface AnalyzeResult {
  queue_id: string | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  ingredients: AnalyzedIngredient[];
  total_count: number;
  halal_count: number;
  haram_count: number;
  mushbooh_count: number;
  unknown_count: number;
  completion_percentage: number;
  error: string | null;
}

export interface AnalyzedIngredient {
  ocr_item_id: string | null;
  ingredient_id: number | null;
  original_text: string;
  display_name: string;
  source_language: string;
  halal_status: HalalStatus;
  confidence: number;
  source: IngredientSource;
  explanation: string | null;
  image_url: string | null;
  is_verified: boolean;
  has_grounding: boolean;
}
