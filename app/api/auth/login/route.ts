import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    )

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!data.user || !data.session) {
      return NextResponse.json({ error: 'No se pudo autenticar' }, { status: 401 })
    }

    const response = NextResponse.json({
      user: data.user,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })

    // Cookie que supabase-ssr puede leer:
    // Formato: "base64-" + base64(JSON con access_token, refresh_token, user)
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1]
    const cookieName = `sb-${projectRef}-auth-token`
    const raw = JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
    })
    const cookieValue = 'base64-' + Buffer.from(raw, 'utf-8').toString('base64')

    response.cookies.set(cookieName, cookieValue, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 })
  }
}
