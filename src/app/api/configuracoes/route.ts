import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserWithRole } from '@/lib/auth/session';
import { checkPermission, PERMISSIONS } from '@/lib/rbac/permissions';
import { prisma } from '@/lib/prisma';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import {
  clinicSettingsUpdateSchema,
  DEFAULT_BUSINESS_HOURS,
  DEFAULT_LUNCH_BREAK,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/lib/validations/clinic-settings';

const SETTINGS_ID = 'default';

/**
 * GET /api/configuracoes
 * Returns current clinic settings (creates default if not exists)
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json(
        { error: 'Nao autenticado' },
        { status: 401 }
      );
    }

    // Authorization check - ADMIN only
    if (!checkPermission(user.role, PERMISSIONS.MANAGE_SYSTEM_CONFIG)) {
      return NextResponse.json(
        { error: 'Sem permissao para acessar configuracoes' },
        { status: 403 }
      );
    }

    // Get settings (upsert to create default if not exists)
    let settings = await prisma.clinicSettings.findUnique({
      where: { id: SETTINGS_ID },
    });

    if (!settings) {
      // Create default settings
      settings = await prisma.clinicSettings.create({
        data: {
          id: SETTINGS_ID,
          businessHours: DEFAULT_BUSINESS_HOURS,
          lunchBreak: DEFAULT_LUNCH_BREAK,
          antecedenciaMinima: 24,
          notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configuracoes' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/configuracoes
 * Updates clinic settings (partial updates supported)
 */
export async function PUT(request: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json(
        { error: 'Nao autenticado' },
        { status: 401 }
      );
    }

    // Authorization check - ADMIN only
    if (!checkPermission(user.role, PERMISSIONS.MANAGE_SYSTEM_CONFIG)) {
      return NextResponse.json(
        { error: 'Sem permissao para atualizar configuracoes' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = clinicSettingsUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados invalidos',
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Get current settings for audit log comparison
    const currentSettings = await prisma.clinicSettings.findUnique({
      where: { id: SETTINGS_ID },
    });

    // Build update data (only include provided fields)
    const updateData: any = {};
    if (validatedData.businessHours !== undefined) {
      updateData.businessHours = validatedData.businessHours;
    }
    if (validatedData.lunchBreak !== undefined) {
      updateData.lunchBreak = validatedData.lunchBreak;
    }
    if (validatedData.antecedenciaMinima !== undefined) {
      updateData.antecedenciaMinima = validatedData.antecedenciaMinima;
    }
    if (validatedData.notificationPreferences !== undefined) {
      updateData.notificationPreferences = validatedData.notificationPreferences;
    }

    // Update settings (upsert to handle case where default doesn't exist)
    const updatedSettings = await prisma.clinicSettings.upsert({
      where: { id: SETTINGS_ID },
      update: updateData,
      create: {
        id: SETTINGS_ID,
        businessHours: validatedData.businessHours || DEFAULT_BUSINESS_HOURS,
        lunchBreak: validatedData.lunchBreak || DEFAULT_LUNCH_BREAK,
        antecedenciaMinima: validatedData.antecedenciaMinima || 24,
        notificationPreferences: validatedData.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES,
      },
    });

    // Get request headers for audit log
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Audit log with details of what changed
    await logAudit({
      userId: user.id,
      action: AuditAction.UPDATE_SETTINGS,
      resource: 'clinic_settings',
      resourceId: SETTINGS_ID,
      details: {
        updatedFields: Object.keys(updateData),
        previousValues: currentSettings ? {
          businessHours: currentSettings.businessHours,
          lunchBreak: currentSettings.lunchBreak,
          antecedenciaMinima: currentSettings.antecedenciaMinima,
          notificationPreferences: currentSettings.notificationPreferences,
        } : null,
        newValues: updateData,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configuracoes' },
      { status: 500 }
    );
  }
}
