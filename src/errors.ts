export class HalalScannerError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly endpoint?: string
  ) {
    super(message);
    this.name = 'HalalScannerError';
  }
}

export class RateLimitError extends HalalScannerError {
  constructor(endpoint: string) {
    super('Rate limit exceeded. Please wait before making more requests.', 429, endpoint);
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends HalalScannerError {
  constructor(message: string, endpoint: string) {
    super(`Network error: ${message}`, undefined, endpoint);
    this.name = 'NetworkError';
  }
}
