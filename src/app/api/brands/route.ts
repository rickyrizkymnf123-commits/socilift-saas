import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { Brand } from '@/types/database';

export async function GET() {
  try {
    const org = dbStore.getOrganizations()[0];
    const brands = dbStore.getBrands(org?.id);
    return NextResponse.json({ brands });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const org = dbStore.getOrganizations()[0];
    const newBrand: Brand = {
      id: 'b-' + Date.now(),
      org_id: org.id,
      name: body.name || 'Brand Baru',
      color: body.color || '#2563EB',
      pillars: body.pillars || ['Edukasi', 'Promosi', 'Behind The Scene'],
      funnels: body.funnels || ['TOFU (Top of Funnel)', 'MOFU (Middle of Funnel)', 'BOFU (Bottom of Funnel)'],
      objectives: body.objectives || ['Brand Awareness', 'Engagement', 'Sales & Conversion'],
      details: body.details || {},
      created_by: body.created_by || null,
      created_at: new Date().toISOString(),
    };
    dbStore.createBrand(newBrand);
    return NextResponse.json({ success: true, brand: newBrand });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ error: 'Brand ID required' }, { status: 400 });
    const updated = dbStore.updateBrand(id, updates);
    return NextResponse.json({ success: true, brand: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
