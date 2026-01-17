import { z } from 'zod';

/**
 * Time format validation (HH:mm)
 */
const timeSchema = z.string().regex(
  /^([01]\d|2[0-3]):([0-5]\d)$/,
  'Horário inválido (formato: HH:mm)'
);

/**
 * Day hours configuration schema
 */
const dayHoursSchema = z.object({
  open: timeSchema,
  close: timeSchema,
  closed: z.boolean().default(false),
}).refine(
  (data) => {
    if (data.closed) return true;
    // Convert times to minutes for comparison
    const [openH, openM] = data.open.split(':').map(Number);
    const [closeH, closeM] = data.close.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    return closeMinutes > openMinutes;
  },
  {
    message: 'Horário de fechamento deve ser após horário de abertura',
  }
);

/**
 * Business hours schema for all days of the week
 */
const businessHoursSchema = z.object({
  monday: dayHoursSchema,
  tuesday: dayHoursSchema,
  wednesday: dayHoursSchema,
  thursday: dayHoursSchema,
  friday: dayHoursSchema,
  saturday: dayHoursSchema,
  sunday: dayHoursSchema,
});

/**
 * Lunch break schema
 */
const lunchBreakSchema = z.object({
  start: timeSchema,
  end: timeSchema,
  disabled: z.boolean().default(false),
}).refine(
  (data) => {
    if (data.disabled) return true;
    // Convert times to minutes for comparison
    const [startH, startM] = data.start.split(':').map(Number);
    const [endH, endM] = data.end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const duration = endMinutes - startMinutes;
    // Reasonable duration: 30min to 3 hours
    return endMinutes > startMinutes && duration >= 30 && duration <= 180;
  },
  {
    message: 'Horário de almoço inválido (deve ser entre 30 minutos e 3 horas)',
  }
);

/**
 * Notification preferences schema
 */
const notificationPreferencesSchema = z.object({
  alertaConversaTravada: z.boolean().default(true),
  alertaNoShow: z.boolean().default(true),
  resumoDiarioEmail: z.boolean().default(false),
});

/**
 * Complete clinic settings schema
 */
export const clinicSettingsSchema = z.object({
  businessHours: businessHoursSchema,
  lunchBreak: lunchBreakSchema,
  antecedenciaMinima: z.number()
    .int('Deve ser um número inteiro')
    .min(1, 'Antecedência mínima deve ser pelo menos 1 hora')
    .max(168, 'Antecedência mínima não pode exceder 168 horas (1 semana)'),
  notificationPreferences: notificationPreferencesSchema,
});

/**
 * Partial update schema (for PUT requests)
 */
export const clinicSettingsUpdateSchema = z.object({
  businessHours: businessHoursSchema.optional(),
  lunchBreak: lunchBreakSchema.optional(),
  antecedenciaMinima: z.number()
    .int('Deve ser um número inteiro')
    .min(1, 'Antecedência mínima deve ser pelo menos 1 hora')
    .max(168, 'Antecedência mínima não pode exceder 168 horas (1 semana)')
    .optional(),
  notificationPreferences: notificationPreferencesSchema.optional(),
});

/**
 * TypeScript types inferred from schemas
 */
export type DayHours = z.infer<typeof dayHoursSchema>;
export type BusinessHours = z.infer<typeof businessHoursSchema>;
export type LunchBreak = z.infer<typeof lunchBreakSchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export type ClinicSettingsData = z.infer<typeof clinicSettingsSchema>;
export type ClinicSettingsUpdate = z.infer<typeof clinicSettingsUpdateSchema>;

/**
 * Day names mapping (PT-BR)
 */
export const DAY_NAMES: Record<keyof BusinessHours, string> = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

/**
 * Generate time options for select inputs (30-min increments)
 */
export function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      options.push(`${h}:${m}`);
    }
  }
  return options;
}

/**
 * Default business hours configuration
 */
export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { open: '09:00', close: '18:00', closed: false },
  tuesday: { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday: { open: '09:00', close: '18:00', closed: false },
  friday: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '09:00', close: '13:00', closed: false },
  sunday: { open: '09:00', close: '13:00', closed: true },
};

/**
 * Default lunch break configuration
 */
export const DEFAULT_LUNCH_BREAK: LunchBreak = {
  start: '12:00',
  end: '13:00',
  disabled: false,
};

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  alertaConversaTravada: true,
  alertaNoShow: true,
  resumoDiarioEmail: false,
};

/**
 * Antecedência mínima presets (hours)
 */
export const ANTECEDENCIA_PRESETS = [
  { value: 24, label: '24 horas (1 dia)' },
  { value: 48, label: '48 horas (2 dias)' },
  { value: 72, label: '72 horas (3 dias)' },
];
