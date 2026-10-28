export function toBearId(binomial: string): string {
  return binomial
    .toLowerCase()
    .replace(/[^a-z]+/g, '-')
    .replace(/^-|-$/g, '');
}
