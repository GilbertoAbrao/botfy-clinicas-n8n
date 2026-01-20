'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Bell } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ConfigLembrete,
  TEMPLATE_TIPO_LABELS,
  HORAS_ANTES_PRESETS,
} from '@/lib/validations/config-lembrete';

const formSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(50, 'Nome nao pode ter mais de 50 caracteres'),
  horas_antes: z
    .number()
    .int('Horas deve ser um numero inteiro')
    .min(1, 'Minimo 1 hora')
    .max(168, 'Maximo 168 horas (7 dias)'),
  ativo: z.boolean(),
  template_tipo: z
    .string()
    .min(1, 'Tipo de template obrigatorio'),
  prioridade: z
    .number()
    .int('Prioridade deve ser um numero inteiro')
    .min(1, 'Prioridade minima e 1')
    .max(100, 'Prioridade maxima e 100'),
});

type FormData = z.infer<typeof formSchema>;

interface ConfigLembreteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  config?: ConfigLembrete | null;
}

export function ConfigLembreteFormModal({
  isOpen,
  onClose,
  onSuccess,
  config,
}: ConfigLembreteFormModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!config;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      horas_antes: 24,
      template_tipo: 'lembrete',
      prioridade: 1,
      ativo: true,
    },
  });

  const ativo = watch('ativo');
  const templateTipo = watch('template_tipo');

  useEffect(() => {
    if (isOpen) {
      if (config) {
        reset({
          nome: config.nome,
          horas_antes: config.horas_antes,
          template_tipo: config.template_tipo,
          prioridade: config.prioridade ?? 1,
          ativo: config.ativo,
        });
      } else {
        reset({
          nome: '',
          horas_antes: 24,
          template_tipo: 'lembrete',
          prioridade: 1,
          ativo: true,
        });
      }
    }
  }, [isOpen, config, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      const url = isEditing ? `/api/config-lembretes/${config!.id}` : '/api/config-lembretes';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error('Ja existe uma configuracao com este nome');
          return;
        }

        if (result.details) {
          const fieldErrors = result.details
            .map((d: { field: string; message: string }) => `${d.field}: ${d.message}`)
            .join(', ');
          toast.error(`Erro de validacao: ${fieldErrors}`);
          return;
        }

        throw new Error(result.error || 'Erro ao salvar configuracao');
      }

      toast.success(
        isEditing
          ? `Configuracao "${data.nome}" atualizada com sucesso`
          : `Configuracao "${data.nome}" criada com sucesso`
      );
      onSuccess();
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar configuracao';
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
            <Bell className="h-5 w-5" />
            {isEditing ? `Editar: ${config?.nome}` : 'Nova Configuracao de Lembrete'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informacoes da configuracao de lembrete.'
              : 'Configure quando e como os lembretes serao enviados.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Configuracao *</Label>
            <Input
              id="nome"
              {...register('nome')}
              placeholder="Ex: Lembrete 24h, Confirmacao 2h"
              className={errors.nome ? 'border-red-500' : ''}
            />
            {errors.nome && (
              <p className="text-sm text-red-500">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="horas_antes">Horas Antes do Agendamento *</Label>
            <Input
              id="horas_antes"
              type="number"
              min={1}
              max={168}
              {...register('horas_antes', { valueAsNumber: true })}
              placeholder="24"
              className={errors.horas_antes ? 'border-red-500' : ''}
            />
            {errors.horas_antes && (
              <p className="text-sm text-red-500">{errors.horas_antes.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Valores comuns: {HORAS_ANTES_PRESETS.map(p => `${p.value}h`).join(', ')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template_tipo">Tipo de Template *</Label>
            <Select
              value={templateTipo}
              onValueChange={(value) => setValue('template_tipo', value)}
            >
              <SelectTrigger
                id="template_tipo"
                className={errors.template_tipo ? 'border-red-500' : ''}
              >
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TEMPLATE_TIPO_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.template_tipo && (
              <p className="text-sm text-red-500">{errors.template_tipo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prioridade">Prioridade</Label>
            <Input
              id="prioridade"
              type="number"
              min={1}
              max={100}
              {...register('prioridade', { valueAsNumber: true })}
              placeholder="1"
              className={errors.prioridade ? 'border-red-500' : ''}
            />
            {errors.prioridade && (
              <p className="text-sm text-red-500">{errors.prioridade.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Maior prioridade = executado primeiro (1-100)
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ativo">Configuracao Ativa</Label>
              <p className="text-xs text-gray-500">
                Configuracoes inativas nao enviam lembretes
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
                'Criar Configuracao'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
