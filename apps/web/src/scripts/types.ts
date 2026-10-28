export interface Bear {
  id: string;
  name: string;
  binomial: string;
  range: string;
  image: string;
}

export interface ParsedBear {
  name: string;
  binomial: string;
  range: string;
  imageFileName: string | null;
}

export type BearLoadState =
  | { status: 'loading' }
  | { status: 'success'; bears: Bear[] }
  | { status: 'empty' }
  | { status: 'error'; message: string };
