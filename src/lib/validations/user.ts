import { z } from 'zod';
import { Role } from '@prisma/client';

/**
 * Schema for creating a new user
 * Requires email, password, and role
 */
export const createUserSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email não pode ter mais de 255 caracteres'),

  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(72, 'Senha não pode ter mais de 72 caracteres'), // bcrypt limit

  passwordConfirmation: z
    .string()
    .min(1, 'Confirmação de senha é obrigatória'),

  role: z.enum([Role.ADMIN, Role.ATENDENTE], {
    errorMap: () => ({ message: 'Role deve ser ADMIN ou ATENDENTE' }),
  }),
}).refine(data => data.password === data.passwordConfirmation, {
  message: 'As senhas não coincidem',
  path: ['passwordConfirmation'],
});

/**
 * Schema for updating an existing user
 * Password is not included - use separate password reset flow
 */
export const updateUserSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email não pode ter mais de 255 caracteres'),

  role: z.enum([Role.ADMIN, Role.ATENDENTE], {
    errorMap: () => ({ message: 'Role deve ser ADMIN ou ATENDENTE' }),
  }),
});

/**
 * Schema for toggling user active status
 */
export const toggleUserStatusSchema = z.object({
  ativo: z.boolean(),
});

/**
 * TypeScript types inferred from schemas
 */
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type ToggleUserStatusData = z.infer<typeof toggleUserStatusSchema>;

/**
 * User type for API responses (excludes sensitive fields)
 */
export interface UserResponse {
  id: string;
  email: string;
  role: Role;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}
