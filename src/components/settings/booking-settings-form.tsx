'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ANTECEDENCIA_PRESETS } from '@/lib/validations/clinic-settings';

interface BookingSettingsFormProps {
  initialData: number;
}

const bookingSettingsSchema = z.object({
  antecedenciaMinima: z
    .number()
    .int('Deve ser um numero inteiro')
    .min(1, 'Minimo de 1 hora')
    .max(168, 'Maximo de 168 horas (1 semana)'),
});

type BookingSettingsFormData = z.infer<typeof bookingSettingsSchema>;

export function BookingSettingsForm({ initialData }: BookingSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BookingSettingsFormData>({
    resolver: zodResolver(bookingSettingsSchema),
    defaultValues: {
      antecedenciaMinima: initialData,
    },
  });

  const handleSubmit = async (data: BookingSettingsFormData) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ antecedenciaMinima: data.antecedenciaMinima }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar');
      }

      toast.success('Antecedencia minima salva com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar configuracoes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setPreset = (value: number) => {
    form.setValue('antecedenciaMinima', value);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="antecedenciaMinima"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Antecedencia Minima (em horas)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={168}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormDescription>
                Tempo minimo de antecedencia para que o paciente possa agendar uma consulta via chatbot.
                Por exemplo, se configurado para 24 horas, o paciente nao pode agendar para o mesmo dia.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground mr-2 self-center">
            Presets:
          </span>
          {ANTECEDENCIA_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreset(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Antecedencia
          </Button>
        </div>
      </form>
    </Form>
  );
}
