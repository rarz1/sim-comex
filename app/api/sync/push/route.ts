import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
    try {
        const { table, data } = await request.json()
        if (!table || !data) {
            return NextResponse.json({ error: 'table and data are required' }, { status: 400 })
        }
        const supabase = createAdminClient()
        const { error } = await supabase.from(table).upsert(data)
        if (error) {
            console.error(`Error pushing to ${table}:`, error.message)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ ok: true })
    } catch (err: any) {
        console.error('Push API error:', err)
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
    }
}
