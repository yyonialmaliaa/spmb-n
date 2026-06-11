import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const fieldName = formData.get('fieldName') as string

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    }

    // Validasi ukuran maks 2MB
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal 2MB' }, { status: 400 })
    }

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Format file harus JPG, PNG, atau PDF' }, { status: 400 })
    }

    // Buat folder uploads kalau belum ada
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', session.userId)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate nama file unik
    const ext = file.name.split('.').pop()
    const fileName = `${fieldName}-${Date.now()}.${ext}`
    const filePath = path.join(uploadDir, fileName)

    // Simpan file ke disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Return path relatif untuk disimpan di database
    const relativePath = `/uploads/${session.userId}/${fileName}`

    return NextResponse.json({ success: true, path: relativePath, fileName })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Gagal mengupload file' }, { status: 500 })
  }
}
