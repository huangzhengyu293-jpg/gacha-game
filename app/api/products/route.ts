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

export async function GET() {
  const db = await getDb();
  const col = db.collection<CatalogItem>('products');
  const items = await col.find({}).sort({ createdAt: -1 }).toArray();
  return NextResponse.json(items, {
    headers: { 'x-data-source': 'mongo', 'Cache-Control': 'no-store' },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload: CatalogItem = {
      id: body.id || `item_${Date.now()}`,
      name: String(body.name),
      description: body.description,
      image: String(body.image),
      price: Number(body.price),
      dropProbability: Number(body.dropProbability ?? 0),
      qualityId: body.qualityId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const db = await getDb();
    const col = db.collection<CatalogItem>('products');
    await col.deleteOne({ id: payload.id });
    await col.insertOne(payload);
    return NextResponse.json(payload, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}


