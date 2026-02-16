import type {
  ScannerOptions,
  SearchParams,
  SearchResult,
  IngredientDetail,
  AnalyzeResult,
} from './types';
import { HalalScannerError, RateLimitError, NetworkError } from './errors';

const DEFAULT_BASE_URL = 'https://halallens.no/api';
const DEFAULT_TIMEOUT = 10000;

function generateDeviceId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'hs-';
  for (let i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export class HalalScanner {
  private readonly baseUrl: string;
  private readonly deviceId: string;
  private readonly timeout: number;

  constructor(options: ScannerOptions = {}) {
    this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
    this.deviceId = options.deviceId || generateDeviceId();
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
  }

  /**
   * Search for ingredients by name.
   *
   * @example
   * const results = await scanner.search('gelatin');
   * console.log(results.items[0].halal_status); // "HARAM"
   */
  async search(query: string, params: Partial<SearchParams> = {}): Promise<SearchResult> {
    const searchParams = new URLSearchParams({ search: query });

    if (params.status) searchParams.set('status', params.status);
    if (params.category) searchParams.set('category', params.category);
    if (params.language) searchParams.set('language', params.language);
    if (params.verifiedOnly) searchParams.set('verified_only', 'true');
    if (params.eNumber) searchParams.set('e_number', 'true');
    if (params.page) searchParams.set('page', String(params.page));
    if (params.perPage) searchParams.set('per_page', String(params.perPage));

    return this.request<SearchResult>(
      `/v1/public/ingredients?${searchParams.toString()}`
    );
  }

  /**
   * Get detailed information about a specific ingredient.
   *
   * @param lang - Language code (e.g., "en", "ar", "no")
   * @param name - Ingredient URL slug (e.g., "gelatin", "sugar")
   *
   * @example
   * const detail = await scanner.check('en', 'gelatin');
   * console.log(detail.explanation);
   */
  async check(lang: string, name: string): Promise<IngredientDetail> {
    return this.request<IngredientDetail>(
      `/v1/public/ingredients/${encodeURIComponent(lang)}/${encodeURIComponent(name)}`
    );
  }

  /**
   * Analyze a list of ingredients for halal status.
   *
   * @param ingredients - Array of ingredient names to check
   *
   * @example
   * const result = await scanner.analyze(['gelatin', 'sugar', 'E471']);
   * console.log(`${result.halal_count} halal, ${result.haram_count} haram`);
   */
  async analyze(ingredients: string[]): Promise<AnalyzeResult> {
    return this.request<AnalyzeResult>('/v1/queue/ingredients/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredients: ingredients.map((name) => ({
          name,
          halal_status: 'UNKNOWN',
          language: 'en',
          confidence: 0.0,
        })),
        device_id: this.deviceId,
      }),
    });
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...init?.headers,
        },
      });

      if (response.status === 429) {
        throw new RateLimitError(path);
      }

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new HalalScannerError(
          text || `HTTP ${response.status}`,
          response.status,
          path
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof HalalScannerError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new NetworkError('Request timed out', path);
      }
      throw new NetworkError(
        error instanceof Error ? error.message : 'Unknown error',
        path
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
