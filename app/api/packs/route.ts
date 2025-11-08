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

function toResponsePack(doc: PackDoc) {
  return {
    id: doc.id,
    title: doc.title,
    image: doc.image,
    price: doc.price,
    itemCount: (doc.items || []).length,
    items: (doc.items || []).map(it => ({
      id: it.id,
      name: it.name,
      description: it.description,
      image: it.image,
      price: it.price,
      dropProbability: it.dropProbability,
      qualityId: it.qualityId,
    })),
  };
}

export async function GET() {
  const db = await getDb();
  const col = db.collection<PackDoc>('packs');
  const list = await col.find({}).sort({ createdAt: -1 }).toArray();

  // 读取最新的 products 数据并与 pack.items 按 id 对齐，确保手动更新 products 后列表能立刻反映
  const productIds = new Set<string>();
  for (const p of list) {
    for (const it of (p.items || [])) {
      if (it?.id) productIds.add(it.id);
    }
  }
  let productMap: Map<string, PackItemDoc> = new Map();
  if (productIds.size) {
    const prodCol = db.collection<any>('products');
    const products = await prodCol.find({ id: { $in: Array.from(productIds) } }).toArray();
    productMap = new Map(products.map((x: any) => [x.id, {
      id: x.id,
      name: x.name,
      description: x.description,
      image: x.image,
      price: Number(x.price),
      dropProbability: Number(x.dropProbability ?? x.probability ?? 0),
      qualityId: x.qualityId,
    } as PackItemDoc]));
  }
  const merged = list.map((p) => ({
    ...p,
    items: (p.items || []).map((it) => productMap.get(it.id) ?? it),
  }));

  return NextResponse.json(merged.map(toResponsePack), {
    headers: { 'x-data-source': 'mongo', 'Cache-Control': 'no-store' },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, image, price, items } = body || {};
    if (!title || !image || typeof price !== 'number' || !Array.isArray(items)) {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }
    const packId = id || `user_pack_${Date.now()}`;
    const now = new Date();
    const normalizedItems: PackItemDoc[] = items.map((it: any) => ({
      id: it.id || `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: String(it.name),
      description: it.description,
      image: String(it.image),
      price: Number(it.price),
      dropProbability: Number(it.dropProbability ?? it.probability ?? 0),
      qualityId: it.qualityId,
    }));
    const doc: PackDoc = {
      id: packId,
      title: String(title),
      image: String(image),
      price: Number(price),
      items: normalizedItems,
      createdAt: now,
      updatedAt: now,
    };
    const db = await getDb();
    const col = db.collection<PackDoc>('packs');
    await col.deleteOne({ id: packId });
    await col.insertOne(doc);
    return NextResponse.json(toResponsePack(doc), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}


