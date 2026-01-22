'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import type { Role } from '@prisma/client';

interface User {
  id: string;
  email: string;
  role: Role;
  ativo: boolean;
}

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  user?: User;
  onSuccess: () => void;
}

// Schema for create mode
const createSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  passwordConfirmation: z.string().min(1, 'Confirmacao de senha e obrigatoria'),
  role: z.enum(['ADMIN', 'ATENDENTE']),
}).refine(data => data.password === data.passwordConfirmation, {
  message: 'As senhas nao coincidem',
  path: ['passwordConfirmation'],
});

// Schema for edit mode
const editSchema = z.object({
  email: z.string().email('Email invalido'),
  role: z.enum(['ADMIN', 'ATENDENTE']),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

export function UserFormModal({
  open,
  onOpenChange,
  mode,
  user,
  onSuccess,
}: UserFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'ATENDENTE'>(user?.role || 'ATENDENTE');

  // Use different form setup based on mode
  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      email: '',
      password: '',
      passwordConfirmation: '',
      role: 'ATENDENTE',
    },
  });

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      email: user?.email || '',
      role: user?.role || 'ATENDENTE',
    },
  });

  // Reset form when user changes or modal opens/closes
  useEffect(() => {
    if (open) {
      setApiError(null);
      if (mode === 'edit' && user) {
        editForm.reset({
          email: user.email,
          role: user.role,
        });
        setSelectedRole(user.role);
      } else {
        createForm.reset({
          email: '',
          password: '',
          passwordConfirmation: '',
          role: 'ATENDENTE',
        });
        setSelectedRole('ATENDENTE');
      }
    }
  }, [open, mode, user, createForm, editForm]);

  const handleRoleChange = (value: 'ADMIN' | 'ATENDENTE') => {
    setSelectedRole(value);
    if (mode === 'create') {
      createForm.setValue('role', value);
    } else {
      editForm.setValue('role', value);
    }
  };

  const onSubmitCreate = async (data: CreateFormData) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar usuario');
      }

      toast.success('Usuario criado com sucesso');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating user:', error);
      const message = error instanceof Error ? error.message : 'Erro ao criar usuario';
      setApiError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitEdit = async (data: EditFormData) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch(`/api/usuarios/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar usuario');
      }

      toast.success('Usuario atualizado com sucesso');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating user:', error);
      const message = error instanceof Error ? error.message : 'Erro ao atualizar usuario';
      setApiError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render create mode form
  if (mode === 'create') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo Usuario</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuario.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4">
            {apiError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...createForm.register('email')}
                placeholder="usuario@clinica.com"
                disabled={isSubmitting}
              />
              {createForm.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {createForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...createForm.register('password')}
                  placeholder="Minimo 8 caracteres"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {createForm.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {createForm.formState.errors.password.message}
                </p>
              )}
              <p className="text-xs text-gray-500">
                A senha deve ter pelo menos 8 caracteres
              </p>
            </div>

            {/* Password Confirmation Field */}
            <div className="space-y-2">
              <Label htmlFor="passwordConfirmation">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="passwordConfirmation"
                  type={showPasswordConfirmation ? 'text' : 'password'}
                  {...createForm.register('passwordConfirmation')}
                  placeholder="Repita a senha"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                >
                  {showPasswordConfirmation ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {createForm.formState.errors.passwordConfirmation && (
                <p className="text-sm text-red-500">
                  {createForm.formState.errors.passwordConfirmation.message}
                </p>
              )}
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <Label htmlFor="role">Funcao</Label>
              <Select
                value={selectedRole}
                onValueChange={handleRoleChange}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a funcao" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATENDENTE">Atendente</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
              {createForm.formState.errors.role && (
                <p className="text-sm text-red-500">
                  {createForm.formState.errors.role.message}
                </p>
              )}
            </div>

            {/* Warning for ADMIN role */}
            {selectedRole === 'ADMIN' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Usuarios com funcao <strong>Administrador</strong> tem acesso total ao sistema,
                  incluindo gerenciamento de usuarios e logs de auditoria.
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Usuario'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Render edit mode form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Altere os dados do usuario.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
          {apiError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...editForm.register('email')}
              placeholder="usuario@clinica.com"
              disabled={isSubmitting}
            />
            {editForm.formState.errors.email && (
              <p className="text-sm text-red-500">
                {editForm.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Role Field */}
          <div className="space-y-2">
            <Label htmlFor="role">Funcao</Label>
            <Select
              value={selectedRole}
              onValueChange={handleRoleChange}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a funcao" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ATENDENTE">Atendente</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
              </SelectContent>
            </Select>
            {editForm.formState.errors.role && (
              <p className="text-sm text-red-500">
                {editForm.formState.errors.role.message}
              </p>
            )}
          </div>

          {/* Warning for ADMIN role */}
          {selectedRole === 'ADMIN' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Usuarios com funcao <strong>Administrador</strong> tem acesso total ao sistema,
                incluindo gerenciamento de usuarios e logs de auditoria.
              </AlertDescription>
            </Alert>
          )}

          {/* Note about password */}
          <p className="text-xs text-gray-500">
            Para alterar a senha, utilize a funcao de recuperacao de senha.
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alteracoes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
