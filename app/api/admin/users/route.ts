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
      .select('role, can_create_users')
      .eq('id', session.user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && !(profile.role === 'teacher' && profile.can_create_users))) {
      return NextResponse.json({ error: 'Se requiere rol admin o docente autorizado' }, { status: 403 })
    }

    const isCallerAdmin = profile.role === 'admin'
    const { users } = await request.json()

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'Lista de usuarios vacía' }, { status: 400 })
    }

    const adminClient = createAdminClient()
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

        const { error: upsertError } = await adminClient.from('profiles').upsert({
          id: userId,
          email,
          name: fullName,
          role,
          document_type: documentType || null,
          document_number: documentNumber || null,
          can_create_users: canCreateUsers || false,
        }, { onConflict: 'id' })

        if (upsertError) {
          results.push({ email, success: false, error: `Actualizado en Auth pero falló perfil: ${upsertError.message}` })
          continue
        }

        results.push({ email, success: true, id: userId })
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

        const { error: upsertError } = await adminClient.from('profiles').upsert({
          id: newUser.user.id,
          email,
          name: fullName,
          role,
          document_type: documentType || null,
          document_number: documentNumber || null,
          can_create_users: canCreateUsers || false,
        }, { onConflict: 'id' })

        if (upsertError) {
          results.push({ email, success: false, error: `Creado en Auth pero falló perfil: ${upsertError.message}` })
          continue
        }

        results.push({ email, success: true, id: newUser.user.id })
      }
    }

    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}
