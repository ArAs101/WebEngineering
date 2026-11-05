import { z } from 'zod';

export const BearId = z.string().regex(/^[a-z]+(-[a-z]+)*$/);

export const BearSchema = z.object({
  id: BearId,
  name: z.string().min(1),
  binomial: z.string().min(1),
  imageUrl: z.url().nullable(),
  range: z.string(),
});

z.globalRegistry.add(BearSchema, {
  id: 'Bear',
});

export type Bear = z.infer<typeof BearSchema>;
