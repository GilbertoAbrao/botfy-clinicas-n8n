'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type NotificationPreferences } from '@/lib/validations/clinic-settings';

interface NotificationPreferencesFormProps {
  initialData: NotificationPreferences;
}

const notificationPreferencesSchema = z.object({
  alertaConversaTravada: z.boolean(),
  alertaNoShow: z.boolean(),
  resumoDiarioEmail: z.boolean(),
});

type NotificationPreferencesFormData = z.infer<typeof notificationPreferencesSchema>;

export function NotificationPreferencesForm({ initialData }: NotificationPreferencesFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NotificationPreferencesFormData>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: initialData,
  });

  const handleSubmit = async (data: NotificationPreferencesFormData) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationPreferences: data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar');
      }

      toast.success('Preferencias de notificacao salvas com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar configuracoes');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            As notificacoes sao enviadas atraves dos workflows do N8N.
            Certifique-se de que os workflows estao configurados corretamente.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="alertaConversaTravada"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Alerta de Conversa Travada
                  </FormLabel>
                  <FormDescription>
                    Receba um alerta quando uma conversa com paciente ficar sem resposta por muito tempo.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="alertaNoShow"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Alerta de No-Show
                  </FormLabel>
                  <FormDescription>
                    Receba um alerta quando um paciente nao comparecer a uma consulta agendada.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="resumoDiarioEmail"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Resumo Diario por Email
                  </FormLabel>
                  <FormDescription>
                    Receba um email diario com o resumo de agendamentos, alertas e metricas da clinica.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Preferencias
          </Button>
        </div>
      </form>
    </Form>
  );
}
