import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;
  const supabase = createAdminClient();
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const { id, ...filters } = searchParams;

  let query: any = supabase.from(table).select('*');

  if (id) {
    query = query.eq('id', id).single();
  } else {
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;
  const supabase = createAdminClient();
  const body = await request.json();

  const { data, error } = await supabase.from(table).upsert(body).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data?.[0] ?? null });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const { table } = await params;
  const supabase = createAdminClient();
  const { id } = await request.json();

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
