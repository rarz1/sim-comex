import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function rawUpsert(table: string, body: Record<string, any>) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: 'resolution=merge-duplicates, return=representation',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    let msg = text
    try { const j = JSON.parse(text); msg = j.message || j.error || text } catch {}
    throw new Error(msg)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { users, callerUserId } = body

    if (!callerUserId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'Lista de usuarios vacía' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Resolve caller role: profiles table → user_metadata → email inference
    let callerRole: string | null = null
    let callerCanCreate = false

    const { data: profile, error: profileErr } = await adminClient
      .from('profiles')
      .select('role, can_create_users')
      .eq('id', callerUserId)
      .maybeSingle()

    if (profile?.role && profile.role !== 'student') {
      callerRole = profile.role
      callerCanCreate = (profile as any).can_create_users ?? false
    } else {
      // Check user_metadata from Supabase Auth
      const { data: authUser } = await adminClient.auth.admin.getUserById(callerUserId)
      const metaRole = authUser?.user?.user_metadata?.role as string | undefined
      const email = authUser?.user?.email || ''
      if (metaRole) {
        callerRole = metaRole
        callerCanCreate = true
      } else if (email) {
        // Infer role from email (same logic as client-side authService)
        const lower = email.toLowerCase()
        if (lower === 'admin@test.com' || lower.includes('admin')) callerRole = 'admin'
        else if (lower.includes('teacher') || lower.includes('docente') || lower.includes('prof')) { callerRole = 'teacher'; callerCanCreate = true }
      }
    }

    if (!callerRole || (callerRole !== 'admin' && !(callerRole === 'teacher' && callerCanCreate))) {
      return NextResponse.json({ error: 'Se requiere rol admin o docente autorizado' }, { status: 403 })
    }

    // Auto-create missing profile so subsequent calls find it in the table
    if (!profile && callerRole) {
      try {
        const { data: authUser } = await adminClient.auth.admin.getUserById(callerUserId)
        const email = authUser?.user?.email || 'unknown@unknown.com'
        await rawUpsert('profiles', {
          id: callerUserId, email, name: callerRole === 'admin' ? 'Administrador' : 'Docente',
          role: callerRole,
        })
      } catch { /* profile auto-create failed, continue anyway */ }
    }

    const isCallerAdmin = callerRole === 'admin'

    const results: { email: string; success: boolean; error?: string; id?: string }[] = []

    for (const u of users) {
      const email = u.email?.trim().toLowerCase()
      const { id: existingId, password, fullName, role, documentType, documentNumber, canCreateUsers } = u

      if (!email) {
        results.push({ email: 'unknown', success: false, error: 'Email obligatorio' })
        continue
      }

      // Check if user already exists in profiles
      let userId = existingId
      if (!userId) {
        const { data: existingProf } = await adminClient
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle()
        if (existingProf) {
          userId = existingProf.id
        }
      }

      if (userId) {
        // We are updating an existing user
        if (!isCallerAdmin) {
          results.push({ email, success: false, error: 'El usuario ya existe. Los docentes no pueden modificar usuarios existentes.' })
          continue
        }

        const updateData: any = {
          email,
          user_metadata: { role, full_name: fullName }
        }
        if (password) {
          updateData.password = password
        }

        const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, updateData)
        if (updateError) {
          results.push({ email, success: false, error: `Error al actualizar en Auth: ${updateError.message}` })
          continue
        }

        try {
          await rawUpsert('profiles', {
            id: userId, email, name: fullName, role,
            document_type: documentType || null,
            document_number: documentNumber || null,
          })
          results.push({ email, success: true, id: userId })
        } catch (upsertErr: any) {
          results.push({ email, success: false, error: `Actualizado en Auth pero falló perfil: ${upsertErr.message}` })
          continue
        }
      } else {
        // We are creating a new user
        if (!password) {
          results.push({ email, success: false, error: 'Contraseña obligatoria para nuevos usuarios' })
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

        try {
          await rawUpsert('profiles', {
            id: newUser.user.id, email, name: fullName, role,
            document_type: documentType || null,
            document_number: documentNumber || null,
          })
          results.push({ email, success: true, id: newUser.user.id })
        } catch (upsertErr: any) {
          results.push({ email, success: false, error: `Creado en Auth pero falló perfil: ${upsertErr.message}` })
          continue
        }
      }
    }

    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}
