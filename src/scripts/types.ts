export interface Bear {
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
