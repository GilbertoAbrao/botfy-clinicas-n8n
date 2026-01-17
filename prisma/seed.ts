import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Default clinic settings (idempotent - upsert)
  const defaultBusinessHours = {
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '18:00' },
    saturday: null, // Closed
    sunday: null,   // Closed
  }

  const defaultLunchBreak = {
    start: '12:00',
    end: '13:00',
  }

  const clinicSettings = await prisma.clinicSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      businessHours: defaultBusinessHours,
      lunchBreak: defaultLunchBreak,
      antecedenciaMinima: 24, // 24 hours minimum advance booking
      notificationPreferences: null,
    },
  })

  console.log('Created/verified clinic settings:', clinicSettings.id)
  console.log('  Business hours: Mon-Fri 09:00-18:00, Sat-Sun closed')
  console.log('  Lunch break: 12:00-13:00')
  console.log('  Minimum advance booking: 24 hours')

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
