import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';

type CatalogItem = {
  id: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  dropProbability: number;
  qualityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const db = await getDb();
  const col = db.collection<CatalogItem>('products');
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
    const col = db.collection<CatalogItem>('products');
    const prev = await col.findOne({ id });
    if (!prev) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const next: Partial<CatalogItem> = {
      ...(typeof patch.name === 'string' ? { name: patch.name } : {}),
      ...(typeof patch.image === 'string' ? { image: patch.image } : {}),
      ...(typeof patch.description === 'string' ? { description: patch.description } : {}),
      ...(typeof patch.price === 'number' ? { price: patch.price } : {}),
      ...(typeof patch.dropProbability === 'number' ? { dropProbability: patch.dropProbability } : {}),
      ...(typeof patch.qualityId === 'string' ? { qualityId: patch.qualityId } : {}),
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
  const col = db.collection<CatalogItem>('products');
  const r = await col.deleteOne({ id });
  if (!r.deletedCount) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}


