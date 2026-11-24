import { z } from 'zod';
import { userRole } from '../db/schema.js';

const minPasswordLength = 12;

export const RegisterBodySchema = z.strictObject({
  email: z.email().toLowerCase(),
  password: z
    .string()
    .refine((value) => Array.from(value).length >= minPasswordLength, {
      message: 'Use at least 12 characters.',
    })
    .meta({
      minLength: minPasswordLength,
      format: 'password',
      writeOnly: true,
    }),
});

export const LoginBodySchema = RegisterBodySchema.extend({
  password: z.string().min(1).meta({ format: 'password', writeOnly: true }),
});

export const PublicUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  role: z.enum(userRole.enumValues),
});

export type PublicUser = z.infer<typeof PublicUserSchema>;
