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
import { MoreHorizontal, Power, PowerOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Service {
  id: string;
  nome: string;
  duracao: number;
  preco: string | number;
  ativo: boolean;
}

interface ServiceActionsProps {
  service: Service;
  onRefresh: () => void;
}

export function ServiceActions({ service, onRefresh }: ServiceActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleActive = async () => {
    setIsLoading(true);

    // Optimistic UI update is handled by parent via onRefresh
    try {
      const response = await fetch(`/api/servicos/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: service.nome,
          duracao: service.duracao,
          preco: typeof service.preco === 'string' ? parseFloat(service.preco) : service.preco,
          ativo: !service.ativo,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar servico');
      }

      toast.success(
        service.ativo
          ? `Servico "${service.nome}" desativado`
          : `Servico "${service.nome}" ativado`
      );
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar servico');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/servicos/${service.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir servico');
      }

      if (data.hadAppointments) {
        toast.warning(
          `Servico "${service.nome}" excluido. ${data.appointmentCount} agendamentos usavam este servico.`
        );
      } else {
        toast.success(`Servico "${service.nome}" excluido com sucesso`);
      }

      setIsDeleteDialogOpen(false);
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir servico');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleToggleActive}
            disabled={isLoading}
          >
            {service.ativo ? (
              <>
                <PowerOff className="mr-2 h-4 w-4" />
                Desativar
              </>
            ) : (
              <>
                <Power className="mr-2 h-4 w-4" />
                Ativar
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isLoading}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir servico?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o servico &quot;{service.nome}&quot;?
              <br />
              <br />
              <strong>Atencao:</strong> Se existirem agendamentos que usam este servico,
              eles manterao o nome do servico, mas nao estarao mais vinculados ao cadastro.
              <br />
              <br />
              Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isLoading ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
