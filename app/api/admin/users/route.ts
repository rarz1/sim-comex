import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(request)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Se requiere rol admin' }, { status: 403 })
    }

    const { users } = await request.json()

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'Lista de usuarios vacía' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const results: { email: string; success: boolean; error?: string }[] = []

    for (const u of users) {
      const email = u.email?.trim().toLowerCase()
      const { password, fullName, role, documentType, documentNumber } = u

      if (!email || !password) {
        results.push({ email: u.email || 'unknown', success: false, error: 'Email y password obligatorios' })
        continue
      }

      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role, full_name: fullName },
      })

      if (createError) {
        if (createError.message?.includes('already exists')) {
          results.push({ email, success: false, error: 'El usuario ya existe en Auth' })
        } else {
          results.push({ email, success: false, error: createError.message })
        }
        continue
      }

      if (!newUser.user) {
        results.push({ email, success: false, error: 'No se pudo crear el usuario' })
        continue
      }

      const { error: upsertError } = await adminClient.from('profiles').upsert({
        id: newUser.user.id,
        email,
        name: fullName,
        role,
        document_number: documentNumber || null,
      }, { onConflict: 'id' })

      if (upsertError) {
        results.push({ email, success: false, error: `Creado en Auth pero falló perfil: ${upsertError.message}` })
        continue
      }

      results.push({ email, success: true })
    }

    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}
