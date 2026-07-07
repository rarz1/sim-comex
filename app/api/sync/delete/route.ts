import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
    try {
        const { table, id } = await request.json()
        if (!table || !id) {
            return NextResponse.json({ error: 'table and id are required' }, { status: 400 })
        }
        const supabase = createAdminClient()
        const { error } = await supabase.from(table).delete().eq('id', id)
        if (error) {
            console.error(`Error deleting from ${table}:`, error.message)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ ok: true })
    } catch (err: any) {
        console.error('Delete API error:', err)
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
    }
}
