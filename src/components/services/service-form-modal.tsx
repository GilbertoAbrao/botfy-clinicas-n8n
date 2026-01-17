'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
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
import { Switch } from '@/components/ui/switch';
import { serviceSchema, ServiceInput } from '@/lib/validations/service';

interface Service {
  id: string;
  nome: string;
  duracao: number;
  preco: string | number;
  ativo: boolean;
}

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  service?: Service | null; // If provided, we're editing
}

export function ServiceFormModal({
  isOpen,
  onClose,
  onSuccess,
  service,
}: ServiceFormModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!service;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      nome: '',
      duracao: 30,
      preco: 0,
      ativo: true,
    },
  });

  // Watch ativo value for the switch
  const ativo = watch('ativo');

  // Reset form when modal opens/closes or service changes
  useEffect(() => {
    if (isOpen) {
      if (service) {
        // Editing mode - populate form
        reset({
          nome: service.nome,
          duracao: service.duracao,
          preco: typeof service.preco === 'string' ? parseFloat(service.preco) : service.preco,
          ativo: service.ativo,
        });
      } else {
        // Create mode - reset to defaults
        reset({
          nome: '',
          duracao: 30,
          preco: 0,
          ativo: true,
        });
      }
    }
  }, [isOpen, service, reset]);

  const onSubmit = async (data: ServiceInput) => {
    setLoading(true);

    try {
      const url = isEditing ? `/api/servicos/${service!.id}` : '/api/servicos';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific errors
        if (response.status === 409) {
          toast.error('Ja existe um servico com este nome');
          return;
        }

        // Handle validation errors
        if (result.details) {
          const fieldErrors = result.details
            .map((d: { field: string; message: string }) => `${d.field}: ${d.message}`)
            .join(', ');
          toast.error(`Erro de validacao: ${fieldErrors}`);
          return;
        }

        throw new Error(result.error || 'Erro ao salvar servico');
      }

      toast.success(
        isEditing
          ? `Servico "${data.nome}" atualizado com sucesso`
          : `Servico "${data.nome}" criado com sucesso`
      );
      onSuccess();
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar servico';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isEditing ? `Editar: ${service?.nome}` : 'Novo Servico'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informacoes do servico.'
              : 'Preencha as informacoes para criar um novo servico.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Servico *</Label>
            <Input
              id="nome"
              {...register('nome')}
              placeholder="Ex: Consulta, Retorno, Exame"
              className={errors.nome ? 'border-red-500' : ''}
            />
            {errors.nome && (
              <p className="text-sm text-red-500">{errors.nome.message}</p>
            )}
          </div>

          {/* Duracao */}
          <div className="space-y-2">
            <Label htmlFor="duracao">Duracao (minutos) *</Label>
            <Input
              id="duracao"
              type="number"
              min={5}
              max={480}
              step={5}
              {...register('duracao', { valueAsNumber: true })}
              placeholder="30"
              className={errors.duracao ? 'border-red-500' : ''}
            />
            {errors.duracao && (
              <p className="text-sm text-red-500">{errors.duracao.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Minimo 5 minutos, maximo 8 horas (480 minutos)
            </p>
          </div>

          {/* Preco */}
          <div className="space-y-2">
            <Label htmlFor="preco">Preco (R$) *</Label>
            <Input
              id="preco"
              type="number"
              min={0}
              max={99999.99}
              step={0.01}
              {...register('preco', { valueAsNumber: true })}
              placeholder="0.00"
              className={errors.preco ? 'border-red-500' : ''}
            />
            {errors.preco && (
              <p className="text-sm text-red-500">{errors.preco.message}</p>
            )}
          </div>

          {/* Ativo */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ativo">Servico Ativo</Label>
              <p className="text-xs text-gray-500">
                Servicos inativos nao aparecem para agendamento
              </p>
            </div>
            <Switch
              id="ativo"
              checked={ativo}
              onCheckedChange={(checked) => setValue('ativo', checked)}
            />
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="h-11 sm:h-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 sm:h-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Salvando...' : 'Criando...'}
                </>
              ) : isEditing ? (
                'Salvar Alteracoes'
              ) : (
                'Criar Servico'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
