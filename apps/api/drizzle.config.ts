import { defineConfig } from 'drizzle-kit';
import { z } from 'zod';

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  ...(databaseUrl === undefined
    ? {}
    : {
        dbCredentials: {
          url: z
            .url({ protocol: /^postgres(?:ql)?$/, hostname: /.+/ })
            .parse(databaseUrl),
        },
      }),
});
