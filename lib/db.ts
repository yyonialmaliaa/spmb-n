import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export async function seedIfEmpty() {
  try {
    const count = await prisma.user.count()
    if (count === 0) {
      await prisma.user.create({
        data: {
          email: 'admin@smkcitranegara.sch.id',
          password: await bcrypt.hash('admin123', 10),
          role: 'admin',
          namaLengkap: 'Administrator',
        },
      })
      console.log('✅ Admin default berhasil dibuat')
    }
  } catch (err) {
    console.error('❌ Seed error:', err)
  }
}

export type { User, Pendaftaran } from '@prisma/client'