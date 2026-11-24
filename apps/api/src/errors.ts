import type { ValidationIssue } from './schemas/problem.js';

const PROBLEM_BASE_URI = 'https://bears.example/problems';

export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly problemType: string;
  abstract readonly title: string;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
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

export class EmailAlreadyRegisteredError extends AppError {
  readonly statusCode = 409;
  readonly problemType = `${PROBLEM_BASE_URI}/email-already-registered`;
  readonly title = 'Email already registered';

  constructor() {
    super('This email address is already registered.');
  }
}

export class DatabaseUnavailableError extends AppError {
  readonly statusCode = 503;
  readonly problemType = `${PROBLEM_BASE_URI}/database-unavailable`;
  readonly title = 'Database unavailable';

  constructor(options?: ErrorOptions) {
    super('The database is currently unavailable.', options);
  }
}
