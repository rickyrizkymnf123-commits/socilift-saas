import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Pilih setidaknya 1 pengguna untuk dihapus' }, { status: 400 });
    }

    const result = dbStore.bulkDeleteUsers(userIds);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
