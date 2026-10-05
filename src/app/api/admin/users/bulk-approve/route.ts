import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function POST(req: Request) {
  try {
    const { userIds } = await req.json();
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Daftar ID pengguna wajib diisi' }, { status: 400 });
    }

    const result = dbStore.bulkApproveUsers(userIds);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
