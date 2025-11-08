import { NextRequest, NextResponse } from 'next/server';

import { getDb } from '@/app/lib/mongodb';

type PackItemDoc = {
  id: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  dropProbability: number;
  qualityId?: string;
};
type PackDoc = {
  _id?: any;
  id: string;
  title: string;
  image: string;
  price: number;
  items: PackItemDoc[];
  createdAt: Date;
  updatedAt?: Date;
};

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const db = await getDb();
  const col = db.collection<PackDoc>('packs');
  const found = await col.findOne({ id });
  if (!found) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(found, {
    headers: { 'x-data-source': 'mongo', 'Cache-Control': 'no-store' },
  });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const patch = await req.json();
    const { id } = await context.params;
    const db = await getDb();
    const col = db.collection<PackDoc>('packs');
    const prev = await col.findOne({ id });
    if (!prev) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const next: Partial<PackDoc> = {
      ...(typeof patch.title === 'string' ? { title: patch.title } : {}),
      ...(typeof patch.image === 'string' ? { image: patch.image } : {}),
      ...(typeof patch.price === 'number' ? { price: patch.price } : {}),
      ...(Array.isArray(patch.items) ? {
        items: patch.items.map((it: any) => ({
          id: it.id || `item_${Date.now()}`,
          name: String(it.name),
          description: it.description,
          image: String(it.image),
          price: Number(it.price),
          dropProbability: Number(it.dropProbability ?? it.probability ?? 0),
          qualityId: it.qualityId,
        })),
      } : {}),
      updatedAt: new Date(),
    };
    await col.updateOne({ id }, { $set: next });
    const updated = await col.findOne({ id });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const db = await getDb();
  const col = db.collection<PackDoc>('packs');
  const r = await col.deleteOne({ id });
  if (!r.deletedCount) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}



