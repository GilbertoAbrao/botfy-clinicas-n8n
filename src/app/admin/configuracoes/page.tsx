import { getCurrentUserWithRole } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { BusinessHoursForm } from '@/components/settings/business-hours-form';
import { LunchBreakForm } from '@/components/settings/lunch-break-form';
import { BookingSettingsForm } from '@/components/settings/booking-settings-form';
import { NotificationPreferencesForm } from '@/components/settings/notification-preferences-form';
import {
  DEFAULT_BUSINESS_HOURS,
  DEFAULT_LUNCH_BREAK,
  DEFAULT_NOTIFICATION_PREFERENCES,
  type BusinessHours,
  type LunchBreak,
  type NotificationPreferences,
} from '@/lib/validations/clinic-settings';

const SETTINGS_ID = 'default';

async function getSettings() {
  let settings = await prisma.clinicSettings.findUnique({
    where: { id: SETTINGS_ID },
  });

  if (!settings) {
    // Return defaults if not yet created
    return {
      businessHours: DEFAULT_BUSINESS_HOURS,
      lunchBreak: DEFAULT_LUNCH_BREAK,
      antecedenciaMinima: 24,
      notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
    };
  }

  return {
    businessHours: settings.businessHours as BusinessHours,
    lunchBreak: settings.lunchBreak as LunchBreak,
    antecedenciaMinima: settings.antecedenciaMinima,
    notificationPreferences: (settings.notificationPreferences as NotificationPreferences) || DEFAULT_NOTIFICATION_PREFERENCES,
  };
}

export default async function ConfiguracoesPage() {
  const user = await getCurrentUserWithRole();
  const settings = await getSettings();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Configuracoes</h1>
          <p className="text-muted-foreground">
            Configure horarios de funcionamento, preferencias de agendamento e notificacoes.
          </p>
        </div>

        <Separator />

        {/* Section: Horario de Funcionamento */}
        <Card>
          <CardHeader>
            <CardTitle>Horario de Funcionamento</CardTitle>
            <CardDescription>
              Configure os horarios de abertura e fechamento para cada dia da semana.
              Dias desmarcados serao considerados fechados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BusinessHoursForm initialData={settings.businessHours} />
          </CardContent>
        </Card>

        {/* Section: Horario de Almoco */}
        <Card>
          <CardHeader>
            <CardTitle>Horario de Almoco</CardTitle>
            <CardDescription>
              Configure o intervalo de almoco. Durante este periodo, nao serao agendados atendimentos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LunchBreakForm initialData={settings.lunchBreak} />
          </CardContent>
        </Card>

        {/* Section: Preferencias de Agendamento */}
        <Card>
          <CardHeader>
            <CardTitle>Preferencias de Agendamento</CardTitle>
            <CardDescription>
              Configure a antecedencia minima para marcacao de consultas pelo chatbot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BookingSettingsForm initialData={settings.antecedenciaMinima} />
          </CardContent>
        </Card>

        {/* Section: Notificacoes */}
        <Card>
          <CardHeader>
            <CardTitle>Notificacoes</CardTitle>
            <CardDescription>
              Configure quais notificacoes voce deseja receber. As notificacoes sao enviadas via workflows do N8N.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationPreferencesForm initialData={settings.notificationPreferences} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
