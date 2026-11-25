import { z } from 'zod';

const OriginSchema = z
  .url({ protocol: /^https?$/ })
  .pipe(
    z
      .string()
      .refine(
        (value) => !value.includes('*') && new URL(value).origin === value,
        'Use a complete, exact origin without a path.'
      )
  );

const DatabaseEnvSchema = z.object({
  DATABASE_URL: z
    .url({ protocol: /^postgres(?:ql)?$/, hostname: /.+/ })
    .default('postgresql://bears@127.0.0.1:5433/bears'),
  POSTGRES_PASSWORD: z.string().min(1).optional(),
});

export const LimitsSchema = z.object({
  BODY_LIMIT_BYTES: z.coerce
    .number()
    .int()
    .min(1)
    .max(1024 * 1024)
    .default(16 * 1024),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1000).default(10),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(86_400_000)
    .default(60_000),
});
export type ApiLimits = z.infer<typeof LimitsSchema>;

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_VERSION: z.string().min(1).default('dev'),
});

const ServerEnvSchema = EnvSchema.extend({
  ...LimitsSchema.shape,
  SESSION_SECRET: z.string().min(32),
  TRUSTED_PROXY_IP: z.union([z.ipv4(), z.ipv6()]).optional(),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value.trim() === '' ? [] : value.split(',').map((item) => item.trim())
    )
    .pipe(z.array(OriginSchema)),
});

function parseEnv<S extends z.ZodType>(
  schema: S,
  raw: NodeJS.ProcessEnv
): z.output<S> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join('.'));
    throw new Error(`Invalid environment configuration: ${fields.join(', ')}`);
  }
  return result.data;
}

export function readDatabaseUrl(raw: NodeJS.ProcessEnv = process.env): string {
  const settings = parseEnv(DatabaseEnvSchema, raw);
  const url = new URL(settings.DATABASE_URL);
  if (settings.POSTGRES_PASSWORD !== undefined) {
    url.searchParams.delete('password');
    url.password = encodeURIComponent(settings.POSTGRES_PASSWORD);
  }
  const queryPassword = url.searchParams.get('password') ?? '';
  if (url.password === '' && queryPassword === '') {
    throw new Error(
      'Set POSTGRES_PASSWORD or supply a DATABASE_URL with a password.'
    );
  }
  return url.href;
}

export function readEnv(
  raw: NodeJS.ProcessEnv = process.env
): z.infer<typeof EnvSchema> & { DATABASE_URL: string } {
  return { ...parseEnv(EnvSchema, raw), DATABASE_URL: readDatabaseUrl(raw) };
}

export function readServerEnv(
  raw: NodeJS.ProcessEnv = process.env
): z.infer<typeof ServerEnvSchema> & { DATABASE_URL: string } {
  return {
    ...parseEnv(ServerEnvSchema, raw),
    DATABASE_URL: readDatabaseUrl(raw),
  };
}
