'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
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
  type LunchBreak,
  generateTimeOptions,
} from '@/lib/validations/clinic-settings';

interface LunchBreakFormProps {
  initialData: LunchBreak;
}

const TIME_OPTIONS = generateTimeOptions();

const lunchBreakFormSchema = z.object({
  start: z.string(),
  end: z.string(),
  disabled: z.boolean(),
});

type LunchBreakFormData = z.infer<typeof lunchBreakFormSchema>;

export function LunchBreakForm({ initialData }: LunchBreakFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LunchBreakFormData>({
    resolver: zodResolver(lunchBreakFormSchema),
    defaultValues: initialData,
  });

  const isDisabled = form.watch('disabled');

  const handleSubmit = async (data: LunchBreakFormData) => {
    try {
      setIsSubmitting(true);

      // Validate lunch break duration if enabled
      if (!data.disabled) {
        const [startH, startM] = data.start.split(':').map(Number);
        const [endH, endM] = data.end.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        const duration = endMinutes - startMinutes;

        if (endMinutes <= startMinutes) {
          toast.error('Horario de fim deve ser apos o inicio');
          return;
        }

        if (duration < 30) {
          toast.error('Horario de almoco deve ter pelo menos 30 minutos');
          return;
        }

        if (duration > 180) {
          toast.error('Horario de almoco nao pode exceder 3 horas');
          return;
        }
      }

      const response = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lunchBreak: data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar');
      }

      toast.success('Horario de almoco salvo com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar configuracoes');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="disabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer">
                  Sem horario de almoco
                </FormLabel>
                <FormDescription>
                  Marque esta opcao se a clinica nao possui intervalo de almoco
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex items-center gap-4">
          <FormField
            control={form.control}
            name="start"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Inicio do almoco</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isDisabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={`lunch-start-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <span className="text-muted-foreground mt-6">ate</span>

          <FormField
            control={form.control}
            name="end"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Fim do almoco</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isDisabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={`lunch-end-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Horario de Almoco
          </Button>
        </div>
      </form>
    </Form>
  );
}
