import { NextResponse } from 'next/server'
import { seedIfEmpty } from '@/lib/db'

export async function GET() {
  await seedIfEmpty()
  return NextResponse.json({ message: 'Seed selesai! Admin sudah dibuat.' })
}