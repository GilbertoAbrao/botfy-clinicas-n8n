'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  type BusinessHours,
  DAY_NAMES,
  generateTimeOptions,
} from '@/lib/validations/clinic-settings';

interface BusinessHoursFormProps {
  initialData: BusinessHours;
}

const TIME_OPTIONS = generateTimeOptions();

// Client-side schema (without refinement for partial updates)
const dayHoursSchema = z.object({
  open: z.string(),
  close: z.string(),
  closed: z.boolean(),
});

const businessHoursFormSchema = z.object({
  monday: dayHoursSchema,
  tuesday: dayHoursSchema,
  wednesday: dayHoursSchema,
  thursday: dayHoursSchema,
  friday: dayHoursSchema,
  saturday: dayHoursSchema,
  sunday: dayHoursSchema,
});

type BusinessHoursFormData = z.infer<typeof businessHoursFormSchema>;

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

export function BusinessHoursForm({ initialData }: BusinessHoursFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BusinessHoursFormData>({
    resolver: zodResolver(businessHoursFormSchema),
    defaultValues: initialData,
  });

  const handleSubmit = async (data: BusinessHoursFormData) => {
    try {
      setIsSubmitting(true);

      // Validate that close time is after open time for each open day
      for (const day of DAYS) {
        const dayData = data[day];
        if (!dayData.closed) {
          const [openH, openM] = dayData.open.split(':').map(Number);
          const [closeH, closeM] = dayData.close.split(':').map(Number);
          const openMinutes = openH * 60 + openM;
          const closeMinutes = closeH * 60 + closeM;
          if (closeMinutes <= openMinutes) {
            toast.error(`${DAY_NAMES[day]}: Horario de fechamento deve ser apos abertura`);
            return;
          }
        }
      }

      const response = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessHours: data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar');
      }

      toast.success('Horario de funcionamento salvo com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar configuracoes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToWeekdays = () => {
    const monday = form.getValues('monday');
    WEEKDAYS.forEach((day) => {
      if (day !== 'monday') {
        form.setValue(day, { ...monday });
      }
    });
    toast.info('Horario de segunda-feira copiado para os dias uteis');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyToWeekdays}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copiar para dias uteis
          </Button>
        </div>

        <div className="space-y-4">
          {DAYS.map((day) => {
            const isClosed = form.watch(`${day}.closed`);

            return (
              <div
                key={day}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border"
              >
                <div className="flex items-center gap-3 min-w-[160px]">
                  <FormField
                    control={form.control}
                    name={`${day}.closed`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={!field.value}
                            onCheckedChange={(checked) => field.onChange(!checked)}
                          />
                        </FormControl>
                        <FormLabel className="font-medium cursor-pointer">
                          {DAY_NAMES[day]}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center gap-2 flex-1">
                  <FormField
                    control={form.control}
                    name={`${day}.open`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isClosed}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Abertura" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={`${day}-open-${time}`} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <span className="text-muted-foreground">ate</span>

                  <FormField
                    control={form.control}
                    name={`${day}.close`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isClosed}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Fechamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={`${day}-close-${time}`} value={time}>
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

                {isClosed && (
                  <span className="text-sm text-muted-foreground italic">
                    Fechado
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Horarios
          </Button>
        </div>
      </form>
    </Form>
  );
}
