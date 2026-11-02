import type { ValidationIssue } from './schemas/problem.js';

const PROBLEM_BASE_URI = 'https://bears.example/problems';

export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly problemType: string;
  abstract readonly title: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly problemType = `${PROBLEM_BASE_URI}/validation`;
  readonly title = 'Invalid request';
  readonly issues: ValidationIssue[];

  constructor(
    issues: ValidationIssue[],
    message = 'The request contains invalid data.'
  ) {
    super(message);
    this.issues = issues;
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly problemType = `${PROBLEM_BASE_URI}/not-found`;
  readonly title = 'Resource not found';

  constructor(resource: string) {
    super(`${resource} not found.`);
  }
}

export class UpstreamError extends AppError {
  readonly statusCode = 502;
  readonly problemType = `${PROBLEM_BASE_URI}/upstream`;
  readonly title = 'Upstream unavailable';

  constructor() {
    super('Wikipedia is unavailable or returned invalid data.');
  }
}

export class UpstreamTimeoutError extends AppError {
  readonly statusCode = 504;
  readonly problemType = `${PROBLEM_BASE_URI}/upstream-timeout`;
  readonly title = 'Upstream timeout';

  constructor() {
    super('Wikipedia did not respond in time.');
  }
}
