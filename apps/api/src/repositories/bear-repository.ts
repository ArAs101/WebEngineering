import type { Bear } from '../schemas/bear.js';

export interface BearRepository {
  list: (query?: string) => Promise<Bear[]>;
  findById: (id: string) => Promise<Bear | null>;
}
