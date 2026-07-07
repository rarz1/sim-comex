import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const TABLES = ['profiles', 'groups', 'modules', 'templates', 'catalogs', 'drafts', 'case_folders', 'cases', 'case_assignments'] as const

export async function GET() {
  try {
    const supabase = createAdminClient()
    const result: Record<string, any[]> = {}

    for (const table of TABLES) {
      const { data, error } = await supabase.from(table).select('*')
      if (error) {
        console.error(`Error pulling ${table}:`, error.message)
        result[table] = []
      } else {
        result[table] = data || []
      }
    }

    return NextResponse.json({ ok: true, data: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}
