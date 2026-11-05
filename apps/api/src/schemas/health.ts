import { z } from 'zod';

export const HealthSchema = z.object({
  status: z.literal('ok'),
  version: z.string(),
  uptime: z.number().int().nonnegative(),
});

z.globalRegistry.add(HealthSchema, {
  id: 'HealthStatus',
});
