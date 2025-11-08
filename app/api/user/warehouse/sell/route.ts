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

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const items = Array.isArray(body?.items) ? body.items : (body?.id ? [{ id: String(body.id), count: Number(body.count ?? 1) }] : []);
  if (!items.length) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const db = await getDb();
  const col = db.collection<User>('users');
  const user = await col.findOne({ id: String(userId) });
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  user.warehouse = Array.isArray(user.warehouse) ? user.warehouse : [];

  let gained = 0;
  const now = new Date();
  for (const it of items) {
    const wid = String((it as any).id ?? '');
    if (!wid) continue;
    const count = Math.max(1, Number((it as any).count ?? 1));
    const idx = user.warehouse.findIndex(w => w.id === wid);
    if (idx < 0) continue;
    const entry = user.warehouse[idx];
    const sellCount = Math.min(count, Math.max(0, entry.quantity ?? 0));
    if (sellCount <= 0) continue;
    gained += sellCount * Number(entry.price ?? 0);
    const remain = (entry.quantity ?? 0) - sellCount;
    if (remain <= 0) {
      user.warehouse.splice(idx, 1);
    } else {
      user.warehouse[idx] = { ...entry, quantity: remain, updatedAt: now };
    }
  }
  const newBalance = Number((user.balance ?? 0)) + Number(gained);
  await col.updateOne({ id: String(userId) }, { $set: { warehouse: user.warehouse, balance: newBalance, updatedAt: now } });
  return NextResponse.json({ ok: true, sold: items.length, gained: Number(gained.toFixed(2)), balance: Number(newBalance.toFixed(2)) }, { headers: { 'x-data-source': 'mongo', 'Cache-Control': 'no-store' } });
}


