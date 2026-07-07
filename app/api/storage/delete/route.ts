import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

const BUCKET = 'cases-pdf';

export async function POST(request: NextRequest) {
    try {
        const { path } = await request.json();
        if (!path) {
            return NextResponse.json({ error: 'Path is required' }, { status: 400 });
        }

        const supabase = createAdminClient();
        const { error } = await supabase.storage.from(BUCKET).remove([path]);

        if (error) {
            console.error('Storage delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Delete API error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
