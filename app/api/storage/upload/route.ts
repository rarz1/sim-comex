import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

const BUCKET = 'cases-pdf';

const BUCKET_CONFIG = {
    public: true,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    fileSizeLimit: 10485760,
};

async function ensureBucket() {
    const supabase = createAdminClient();
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.find(b => b.name === BUCKET);
    if (!exists) {
        const { error } = await supabase.storage.createBucket(BUCKET, BUCKET_CONFIG);
        if (error) console.error('Error creating bucket:', error);
    } else {
        const { error } = await supabase.storage.updateBucket(BUCKET, BUCKET_CONFIG);
        if (error) console.error('Error updating bucket:', error);
    }
}

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const path = formData.get('path') as string | null;

        if (!file || !path) {
            return NextResponse.json({ error: 'File and path are required' }, { status: 400 });
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: 'Only PDF and JPG files are allowed' }, { status: 400 });
        }

        await ensureBucket();

        const supabase = createAdminClient();
        const bytes = await file.arrayBuffer();
        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(path, new Uint8Array(bytes), {
                contentType: file.type,
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
