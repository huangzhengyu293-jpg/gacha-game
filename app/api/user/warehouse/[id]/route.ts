import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

type WarehouseItem = {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  qualityId?: string;
  quantity: number;
  obtainedAt: Date;
  updatedAt?: Date;
};

type User = {
  _id?: any;
  id: string;
  username: string;
  balance: number;
  warehouse: WarehouseItem[];
  createdAt?: Date;
  updatedAt?: Date;
};

async function getUserId(req: NextRequest): Promise<string | null> {
  const session: any = await getServerSession(authOptions as any).catch(() => null);
  const sessionId = session?.user?.email || session?.user?.id || null;
  const headerId = req.headers.get('x-user-id');
  // @ts-ignore
  const cookieId = req.cookies?.get?.('uid')?.value ?? null;
  return (sessionId as string) || headerId || cookieId || null;
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await context.params;
  const db = await getDb();
  const col = db.collection<User>('users');
  const user = await col.findOne({ id: String(userId) }, { projection: { warehouse: 1 } });
  const item = user?.warehouse?.find(w => w.id === id);
  if (!item) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(item, { headers: { 'x-data-source': 'mongo', 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const patch = await req.json().catch(() => ({}));
  const { id } = await context.params;
  const db = await getDb();
  const col = db.collection<User>('users');
  const user = await col.findOne({ id: String(userId) });
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const idx = (user.warehouse ?? []).findIndex(w => w.id === id);
  if (idx < 0) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const prev = user.warehouse[idx];
  const nextQty = typeof patch.quantity === 'number' ? Math.max(0, Number(patch.quantity)) : (prev.quantity ?? 0);
  const next: WarehouseItem = {
    ...prev,
    ...(typeof patch.name === 'string' ? { name: patch.name } : {}),
    ...(typeof patch.image === 'string' ? { image: patch.image } : {}),
    ...(typeof patch.price === 'number' ? { price: Number(patch.price) } : {}),
    ...(typeof patch.qualityId === 'string' ? { qualityId: patch.qualityId } : {}),
    ...(typeof patch.quantity === 'number' ? { quantity: nextQty } : {}),
    updatedAt: new Date(),
  };
  if (typeof patch.quantity === 'number' && nextQty <= 0) {
    // 数量降为 0：从仓库中移除该条目
    user.warehouse.splice(idx, 1);
    await col.updateOne({ id: String(userId) }, { $set: { warehouse: user.warehouse, updatedAt: new Date() } });
    return NextResponse.json({ ok: true, deleted: true }, { headers: { 'x-data-source': 'mongo', 'Cache-Control': 'no-store' } });
  } else {
    user.warehouse[idx] = next;
    await col.updateOne({ id: String(userId) }, { $set: { warehouse: user.warehouse, updatedAt: new Date() } });
    return NextResponse.json(next, { headers: { 'x-data-source': 'mongo', 'Cache-Control': 'no-store' } });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await context.params;
  const db = await getDb();
  const col = db.collection<User>('users');
  const user = await col.findOne({ id: String(userId) });
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const before = user.warehouse?.length ?? 0;
  user.warehouse = (user.warehouse ?? []).filter(w => w.id !== id);
  if ((user.warehouse?.length ?? 0) === before) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await col.updateOne({ id: String(userId) }, { $set: { warehouse: user.warehouse, updatedAt: new Date() } });
  return NextResponse.json({ ok: true }, { headers: { 'x-data-source': 'mongo', 'Cache-Control': 'no-store' } });
}


