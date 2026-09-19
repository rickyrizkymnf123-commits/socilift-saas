import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.role || body.name !== undefined || body.is_approved !== undefined) {
      dbStore.updateAdminUser(id, {
        role: body.role,
        name: body.name,
        is_approved: body.is_approved,
      });
    }

    if (body.subscription) {
      dbStore.saveUserSubscription(id, body.subscription);
    }

    if (body.quickExtendDays) {
      dbStore.quickExtendSubscription(id, Number(body.quickExtendDays));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = dbStore.deleteAdminUser(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
