'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Patient } from '@prisma/client';

import {
  patientSchema,
  type PatientFormData,
  autoFormatCPF,
  autoFormatPhone,
} from '@/lib/validations/patient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface PatientFormProps {
  mode: 'create' | 'edit';
  initialData?: Patient;
  onSubmit: (data: PatientFormData) => Promise<void>;
  onCancel: () => void;
}

const CONVENIO_OPTIONS = [
  'Unimed',
  'Bradesco Saúde',
  'Amil',
  'SulAmérica',
  'Sem Convênio',
  'Outro',
];

export function PatientForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
}: PatientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with react-hook-form and Zod validation
  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      telefone: initialData?.telefone || '',
      email: initialData?.email || '',
      cpf: initialData?.cpf || '',
      dataNascimento: initialData?.dataNascimento
        ? format(new Date(initialData.dataNascimento), 'yyyy-MM-dd')
        : '',
      convenio: initialData?.convenio || '',
      observacoes: initialData?.observacoes || '',
    },
  });

  const handleSubmit = async (data: PatientFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Seção 1: Informações de Contato */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Informações de Contato</h3>
            <p className="text-sm text-muted-foreground">
              Campos obrigatórios para identificação do paciente
            </p>
          </div>
          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nome <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome completo do paciente"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Telefone <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+55 11 98765-4321"
                      {...field}
                      onChange={(e) => {
                        const formatted = autoFormatPhone(e.target.value);
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Seção 2: Dados Pessoais */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Dados Pessoais</h3>
            <p className="text-sm text-muted-foreground">
              Informações adicionais do paciente
            </p>
          </div>
          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123.456.789-00"
                      {...field}
                      onChange={(e) => {
                        const formatted = autoFormatCPF(e.target.value);
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataNascimento"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Nascimento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), 'dd/MM/yyyy')
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(format(date, 'yyyy-MM-dd'));
                          } else {
                            field.onChange('');
                          }
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre o paciente (alergias, condições especiais, etc.)"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Seção 3: Convênio */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Convênio</h3>
            <p className="text-sm text-muted-foreground">
              Informações sobre plano de saúde
            </p>
          </div>
          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="convenio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Convênio</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o convênio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CONVENIO_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Cadastrar' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
