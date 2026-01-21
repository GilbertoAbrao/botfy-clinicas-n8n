'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, FileText } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  instructionSchema,
  Instruction,
  InstructionInput,
  INSTRUCTION_TYPES,
  INSTRUCTION_TYPE_LABELS,
} from '@/lib/validations/instruction';
import { WhatsAppPreview } from './whatsapp-preview';

interface Service {
  id: number;
  nome: string;
}

interface InstructionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  instruction?: (Instruction & { servico?: { nome: string } | null }) | null;
}

export function InstructionFormModal({
  isOpen,
  onClose,
  onSuccess,
  instruction,
}: InstructionFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const isEditing = !!instruction;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InstructionInput>({
    resolver: zodResolver(instructionSchema),
    defaultValues: {
      titulo: '',
      tipoInstrucao: 'geral',
      servicoId: null,
      conteudo: '',
      prioridade: 0,
      ativo: true,
    },
  });

  // Watch values for live preview and controlled components
  const ativo = watch('ativo');
  const conteudo = watch('conteudo');
  const titulo = watch('titulo');
  const tipoInstrucao = watch('tipoInstrucao');
  const servicoId = watch('servicoId');

  // Fetch services when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchServices();
    }
  }, [isOpen]);

  // Reset form when modal opens/closes or instruction changes
  useEffect(() => {
    if (isOpen) {
      if (instruction) {
        // Editing mode - populate form
        reset({
          titulo: instruction.titulo,
          tipoInstrucao: instruction.tipoInstrucao,
          servicoId: instruction.servicoId,
          conteudo: instruction.conteudo,
          prioridade: instruction.prioridade,
          ativo: instruction.ativo,
        });
      } else {
        // Create mode - reset to defaults
        reset({
          titulo: '',
          tipoInstrucao: 'geral',
          servicoId: null,
          conteudo: '',
          prioridade: 0,
          ativo: true,
        });
      }
    }
  }, [isOpen, instruction, reset]);

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      // Fetch from N8N servicos table (integer IDs) instead of services table (UUID IDs)
      const response = await fetch('/api/n8n/servicos?limit=100&ativo=true');
      if (!response.ok) {
        throw new Error('Erro ao buscar servicos');
      }
      const data = await response.json();
      setServices(data.servicos || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Erro ao carregar servicos');
    } finally {
      setLoadingServices(false);
    }
  };

  const onSubmit = async (data: InstructionInput) => {
    setLoading(true);

    try {
      const url = isEditing
        ? `/api/procedures/instructions/${instruction!.id}`
        : '/api/procedures/instructions';
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
          toast.error('Ja existe uma instrucao com este titulo para o servico selecionado');
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

        throw new Error(result.error || 'Erro ao salvar instrucao');
      }

      toast.success(
        isEditing
          ? `Instrucao "${data.titulo}" atualizada com sucesso`
          : `Instrucao "${data.titulo}" criada com sucesso`
      );
      onSuccess();
      handleClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar instrucao';
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEditing ? `Editar: ${instruction?.titulo}` : 'Nova Instrucao'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informacoes da instrucao.'
              : 'Preencha as informacoes para criar uma nova instrucao.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column: Form fields */}
            <div className="space-y-4">
              {/* Titulo */}
              <div className="space-y-2">
                <Label htmlFor="titulo">Titulo *</Label>
                <Input
                  id="titulo"
                  {...register('titulo')}
                  placeholder="Ex: Jejum para exame de sangue"
                  className={errors.titulo ? 'border-red-500' : ''}
                />
                {errors.titulo && (
                  <p className="text-sm text-red-500">{errors.titulo.message}</p>
                )}
              </div>

              {/* Tipo */}
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Instrucao *</Label>
                <Select
                  value={tipoInstrucao}
                  onValueChange={(value) => setValue('tipoInstrucao', value as typeof tipoInstrucao)}
                >
                  <SelectTrigger id="tipo" className={errors.tipoInstrucao ? 'border-red-500' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTRUCTION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {INSTRUCTION_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tipoInstrucao && (
                  <p className="text-sm text-red-500">{errors.tipoInstrucao.message}</p>
                )}
              </div>

              {/* Servico */}
              <div className="space-y-2">
                <Label htmlFor="servico">Servico</Label>
                <Select
                  value={servicoId?.toString() || 'geral'}
                  onValueChange={(value) => setValue('servicoId', value === 'geral' ? null : parseInt(value))}
                  disabled={loadingServices}
                >
                  <SelectTrigger id="servico">
                    <SelectValue placeholder={loadingServices ? 'Carregando...' : 'Selecione'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral (todos os servicos)</SelectItem>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Instrucoes gerais se aplicam a todos os servicos
                </p>
              </div>

              {/* Conteudo */}
              <div className="space-y-2">
                <Label htmlFor="conteudo">Conteudo da Instrucao *</Label>
                <Textarea
                  id="conteudo"
                  {...register('conteudo')}
                  placeholder="Digite o conteudo da instrucao que sera enviada ao paciente..."
                  className={`min-h-[150px] ${errors.conteudo ? 'border-red-500' : ''}`}
                />
                {errors.conteudo && (
                  <p className="text-sm text-red-500">{errors.conteudo.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Variaveis: {'{nome_paciente}'}, {'{data_consulta}'}, {'{servico}'}, {'{profissional}'}, {'{clinica}'}
                </p>
              </div>

              {/* Prioridade */}
              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade</Label>
                <Input
                  id="prioridade"
                  type="number"
                  min={0}
                  max={100}
                  {...register('prioridade', { valueAsNumber: true })}
                  placeholder="0"
                  className={errors.prioridade ? 'border-red-500' : ''}
                />
                {errors.prioridade && (
                  <p className="text-sm text-red-500">{errors.prioridade.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Instrucoes com maior prioridade aparecem primeiro (0-100)
                </p>
              </div>

              {/* Ativo */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ativo">Instrucao Ativa</Label>
                  <p className="text-xs text-gray-500">
                    Instrucoes inativas nao sao enviadas aos pacientes
                  </p>
                </div>
                <Switch
                  id="ativo"
                  checked={ativo}
                  onCheckedChange={(checked) => setValue('ativo', checked)}
                />
              </div>
            </div>

            {/* Right column: WhatsApp Preview */}
            <div className="lg:border-l lg:pl-6">
              <WhatsAppPreview content={conteudo || ''} title={titulo} />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row pt-6 mt-6 border-t">
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
                'Criar Instrucao'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
