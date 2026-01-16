/**
 * Phase 2 Seed Script - Alert Dashboard
 *
 * Seeds test data for development:
 * - 3 patients (varied profiles)
 * - 5 appointments (different statuses)
 * - 3 conversations (IA, HUMANO, FINALIZADO)
 * - 8 alerts (all types and priorities)
 *
 * Run: npm run seed:phase2
 */

import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🌱 Seeding Phase 2 data...\n');

  // Clean existing data (in reverse order due to foreign keys)
  console.log('🧹 Cleaning existing seed data...');
  await prisma.alert.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.patient.deleteMany({});
  console.log('✅ Cleaned\n');

  // ============================================================================
  // PATIENTS
  // ============================================================================
  console.log('👥 Creating patients...');

  const patient1 = await prisma.patient.create({
    data: {
      nome: 'João Silva',
      telefone: '+5511987654321',
      email: 'joao.silva@example.com',
      cpf: '123.456.789-00',
      dataNascimento: new Date('1985-03-15'),
      endereco: 'Rua das Flores, 123, São Paulo - SP',
      convenio: 'Unimed',
      numeroCarteirinha: '1234567890123456',
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      nome: 'Maria Santos',
      telefone: '+5511976543210',
      // Minimal profile - no email, CPF, or insurance
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      nome: 'Carlos Oliveira',
      telefone: '+5511965432109',
      email: 'carlos.oliveira@example.com',
      cpf: '987.654.321-00',
      dataNascimento: new Date('1992-07-22'),
      endereco: 'Av. Paulista, 1000, São Paulo - SP',
      convenio: 'Bradesco Saúde',
      numeroCarteirinha: '9876543210987654',
    },
  });

  console.log(`✅ Created 3 patients\n`);

  // ============================================================================
  // APPOINTMENTS
  // ============================================================================
  console.log('📅 Creating appointments...');

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const appointment1 = await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      serviceType: 'Limpeza de Pele',
      scheduledAt: new Date(today.setHours(14, 0, 0, 0)),
      duration: 60,
      status: 'confirmed',
      confirmedAt: new Date(today.setHours(10, 0, 0, 0)),
      notes: 'Paciente confirmou presença',
    },
  });

  const appointment2 = await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      serviceType: 'Preenchimento Labial',
      scheduledAt: new Date(tomorrow.setHours(10, 30, 0, 0)),
      duration: 90,
      status: 'confirmed',
      confirmedAt: new Date(today.setHours(16, 0, 0, 0)),
    },
  });

  const appointment3 = await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      serviceType: 'Botox',
      scheduledAt: new Date(nextWeek.setHours(15, 0, 0, 0)),
      duration: 45,
      status: 'tentative',
      notes: 'Aguardando confirmação',
    },
  });

  const appointment4 = await prisma.appointment.create({
    data: {
      patientId: patient3.id,
      serviceType: 'Peeling Químico',
      scheduledAt: new Date(nextWeek.setHours(11, 0, 0, 0)),
      duration: 120,
      status: 'tentative',
    },
  });

  const appointment5 = await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      serviceType: 'Consulta',
      scheduledAt: new Date(yesterday.setHours(9, 0, 0, 0)),
      duration: 30,
      status: 'no_show',
      notes: 'Paciente não compareceu',
    },
  });

  console.log(`✅ Created 5 appointments\n`);

  // ============================================================================
  // CONVERSATIONS
  // ============================================================================
  console.log('💬 Creating conversations...');

  const conversation1 = await prisma.conversation.create({
    data: {
      patientId: patient1.id,
      whatsappId: 'conv_001',
      status: 'IA',
      messages: [
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          sender: 'patient',
          content: 'Olá, gostaria de agendar uma limpeza de pele',
        },
        {
          timestamp: new Date(Date.now() - 3500000).toISOString(),
          sender: 'ai',
          content: 'Olá! Claro, vou te ajudar com isso. Qual dia você prefere?',
        },
        {
          timestamp: new Date(Date.now() - 3400000).toISOString(),
          sender: 'patient',
          content: 'Quarta-feira de manhã',
        },
        {
          timestamp: new Date(Date.now() - 3300000).toISOString(),
          sender: 'ai',
          content: 'Perfeito! Temos disponibilidade às 10h. Confirma?',
        },
        {
          timestamp: new Date(Date.now() - 3200000).toISOString(),
          sender: 'patient',
          content: 'Confirmo!',
        },
      ],
      lastMessageAt: new Date(Date.now() - 3200000),
    },
  });

  const conversation2 = await prisma.conversation.create({
    data: {
      patientId: patient2.id,
      whatsappId: 'conv_002',
      status: 'HUMANO',
      messages: [
        {
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          sender: 'patient',
          content: 'Preciso remarcar minha consulta',
        },
        {
          timestamp: new Date(Date.now() - 7100000).toISOString(),
          sender: 'ai',
          content: 'Vou transferir você para um atendente humano.',
        },
        {
          timestamp: new Date(Date.now() - 7000000).toISOString(),
          sender: 'human',
          content: 'Olá! Sou a atendente Ana. Vou te ajudar a remarcar.',
        },
      ],
      lastMessageAt: new Date(Date.now() - 7000000),
    },
  });

  const conversation3 = await prisma.conversation.create({
    data: {
      patientId: patient3.id,
      whatsappId: 'conv_003',
      status: 'FINALIZADO',
      messages: Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() - (86400000 - i * 1000)).toISOString(),
        sender: i % 2 === 0 ? 'patient' : 'ai',
        content:
          i % 2 === 0
            ? `Mensagem do paciente ${i + 1}`
            : `Resposta da IA ${i + 1}`,
      })),
      lastMessageAt: new Date(Date.now() - 86400000 + 9000),
    },
  });

  console.log(`✅ Created 3 conversations\n`);

  // ============================================================================
  // ALERTS
  // ============================================================================
  console.log('🚨 Creating alerts...');

  // Get a user ID for resolvedBy (assuming users exist from Phase 1)
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  const alert1 = await prisma.alert.create({
    data: {
      type: 'conversas_travadas',
      priority: 'urgent',
      status: 'new',
      title: 'Conversa travada com João Silva',
      description: 'IA não conseguiu processar última mensagem há 1 hora',
      patientId: patient1.id,
      conversationId: conversation1.id,
      metadata: {
        lastMessageTime: new Date(Date.now() - 3200000).toISOString(),
        errorCode: 'AI_PROCESSING_TIMEOUT',
      },
    },
  });

  const alert2 = await prisma.alert.create({
    data: {
      type: 'pre_checkins_pendentes',
      priority: 'high',
      status: 'new',
      title: 'Pré check-in pendente - João Silva',
      description: 'Agendamento hoje às 14h sem pré check-in',
      patientId: patient1.id,
      appointmentId: appointment1.id,
      metadata: {
        appointmentTime: appointment1.scheduledAt.toISOString(),
        hoursUntilAppointment: 2,
      },
    },
  });

  const alert3 = await prisma.alert.create({
    data: {
      type: 'agendamentos_nao_confirmados',
      priority: 'high',
      status: 'new',
      title: 'Agendamento não confirmado - Carlos Oliveira',
      description: 'Peeling químico próxima semana sem confirmação',
      patientId: patient3.id,
      appointmentId: appointment4.id,
      metadata: {
        appointmentTime: appointment4.scheduledAt.toISOString(),
        daysUntilAppointment: 7,
      },
    },
  });

  const alert4 = await prisma.alert.create({
    data: {
      type: 'handoff_normal',
      priority: 'low',
      status: 'in_progress',
      title: 'Handoff para humano - Maria Santos',
      description: 'Paciente solicitou atendente humano',
      patientId: patient2.id,
      conversationId: conversation2.id,
      metadata: {
        handoffReason: 'PATIENT_REQUEST',
        handoffTime: new Date(Date.now() - 7100000).toISOString(),
      },
    },
  });

  const alert5 = await prisma.alert.create({
    data: {
      type: 'handoff_erro',
      priority: 'urgent',
      status: 'new',
      title: 'Erro de handoff - João Silva',
      description: 'Sistema não conseguiu transferir para humano',
      patientId: patient1.id,
      conversationId: conversation1.id,
      metadata: {
        errorMessage: 'No available agents',
        errorCode: 'HANDOFF_NO_AGENTS',
        attemptedAt: new Date(Date.now() - 600000).toISOString(),
      },
    },
  });

  const alert6 = await prisma.alert.create({
    data: {
      type: 'conversas_travadas',
      priority: 'high',
      status: 'new',
      title: 'Conversa travada sem paciente identificado',
      description: 'Thread do WhatsApp sem paciente associado',
      // No patientId - edge case
      metadata: {
        whatsappThreadId: 'unknown_thread_001',
        lastActivity: new Date(Date.now() - 7200000).toISOString(),
      },
    },
  });

  const alert7 = await prisma.alert.create({
    data: {
      type: 'pre_checkins_pendentes',
      priority: 'high',
      status: 'resolved',
      title: 'Pré check-in pendente - Maria Santos',
      description: 'Agendamento amanhã sem pré check-in (RESOLVIDO)',
      patientId: patient2.id,
      appointmentId: appointment2.id,
      resolvedAt: new Date(Date.now() - 1800000),
      resolvedBy: adminUser?.id,
      metadata: {
        resolutionNote: 'Paciente completou pré check-in',
      },
    },
  });

  const alert8 = await prisma.alert.create({
    data: {
      type: 'handoff_normal',
      priority: 'low',
      status: 'dismissed',
      title: 'Handoff para humano - João Silva',
      description: 'Paciente desistiu do atendimento (DISPENSADO)',
      patientId: patient1.id,
      conversationId: conversation1.id,
      resolvedAt: new Date(Date.now() - 3600000),
      resolvedBy: adminUser?.id,
      metadata: {
        dismissalReason: 'Patient canceled request',
      },
    },
  });

  console.log(`✅ Created 8 alerts\n`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('📊 Seed Summary:');
  console.log(`  - Patients: 3`);
  console.log(`  - Appointments: 5 (2 confirmed, 2 tentative, 1 no-show)`);
  console.log(`  - Conversations: 3 (IA, HUMANO, FINALIZADO)`);
  console.log(`  - Alerts: 8 (all types, 3 new, 1 in_progress, 1 resolved, 1 dismissed)`);
  console.log('\n✅ Phase 2 seeding complete!\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
