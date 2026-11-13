import { z } from 'zod';

const httpUrl = z.url({ protocol: /^https?$/ });

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url({ protocol: /^postgres(?:ql)?$/, hostname: /.+/ }),
  APP_VERSION: z.string().min(1).default('dev'),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    )
    .pipe(z.array(httpUrl)),
});

export function readEnv(): z.infer<typeof EnvSchema> {
  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join('.'));
    throw new Error(`Invalid environment configuration: ${fields.join(', ')}`);
  }

  return result.data;
}
