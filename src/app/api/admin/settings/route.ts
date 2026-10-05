import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function GET() {
  try {
    const settings = dbStore.getAdminSettings();
    const adminWhatsapp = dbStore.getAdminSetting('admin_whatsapp', '6281234567890');
    return NextResponse.json({
      settings,
      admin_whatsapp: adminWhatsapp
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, value, admin_whatsapp } = body;

    if (admin_whatsapp !== undefined) {
      dbStore.setAdminSetting('admin_whatsapp', admin_whatsapp);
    }

    if (key && value !== undefined) {
      dbStore.setAdminSetting(key, value);
    }

    const updatedWhatsapp = dbStore.getAdminSetting('admin_whatsapp', '6281234567890');
    return NextResponse.json({
      success: true,
      admin_whatsapp: updatedWhatsapp,
      settings: dbStore.getAdminSettings()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
