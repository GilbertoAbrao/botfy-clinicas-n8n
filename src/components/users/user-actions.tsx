'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Pencil, UserX, UserCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Role } from '@prisma/client';
import { UserFormModal } from './user-form-modal';

interface User {
  id: string;
  email: string;
  role: Role;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserActionsProps {
  user: User;
  isCurrentUser: boolean;
  onUserUpdated: () => void;
}

export function UserActions({ user, isCurrentUser, onUserUpdated }: UserActionsProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleStatus = async () => {
    if (isCurrentUser && user.ativo) {
      toast.error('Voce nao pode desativar sua propria conta');
      return;
    }

    setIsToggling(true);
    try {
      const response = await fetch(`/api/usuarios/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ativo: !user.ativo }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao alterar status');
      }

      toast.success(user.ativo ? 'Usuario desativado com sucesso' : 'Usuario reativado com sucesso');
      onUserUpdated();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar status');
    } finally {
      setIsToggling(false);
      setShowDeactivateDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEditModal(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              if (user.ativo) {
                setShowDeactivateDialog(true);
              } else {
                handleToggleStatus();
              }
            }}
            disabled={isCurrentUser && user.ativo}
            className={user.ativo ? 'text-red-600 focus:text-red-600' : 'text-green-600 focus:text-green-600'}
          >
            {isToggling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : user.ativo ? (
              <UserX className="mr-2 h-4 w-4" />
            ) : (
              <UserCheck className="mr-2 h-4 w-4" />
            )}
            {user.ativo ? 'Desativar' : 'Reativar'}
            {isCurrentUser && user.ativo && (
              <span className="ml-2 text-xs text-gray-400">(voce)</span>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Modal */}
      <UserFormModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        mode="edit"
        user={user}
        onSuccess={onUserUpdated}
      />

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuario <span className="font-semibold">{user.email}</span> nao podera mais acessar o sistema.
              Voce pode reativar a conta a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isToggling}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              disabled={isToggling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isToggling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desativando...
                </>
              ) : (
                'Desativar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
