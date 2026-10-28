export class UpstreamError extends Error {
  readonly statusCode = 502;

  constructor() {
    super('Wikipedia is unavailable or returned invalid data.');
    this.name = 'UpstreamError';
  }
}

export class UpstreamTimeoutError extends Error {
  readonly statusCode = 504;

  constructor() {
    super('Wikipedia did not respond in time.');
    this.name = 'UpstreamTimeoutError';
  }
}
