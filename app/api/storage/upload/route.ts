import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

const BUCKET = 'cases-pdf';

async function ensureBucket() {
    const supabase = createAdminClient();
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === BUCKET)) {
        const { error } = await supabase.storage.createBucket(BUCKET, {
            public: true,
            allowedMimeTypes: ['application/pdf'],
            fileSizeLimit: 10485760,
        });
        if (error) console.error('Error creating bucket:', error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const path = formData.get('path') as string | null;

        if (!file || !path) {
            return NextResponse.json({ error: 'File and path are required' }, { status: 400 });
        }
        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
        }

        await ensureBucket();

        const supabase = createAdminClient();
        const bytes = await file.arrayBuffer();
        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(path, new Uint8Array(bytes), {
                contentType: 'application/pdf',
                upsert: true,
            });

        if (error) {
            console.error('Storage upload error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
        return NextResponse.json({ url: publicUrl });
    } catch (err: any) {
        console.error('Upload API error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
