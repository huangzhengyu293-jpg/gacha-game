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

function normalizeIncoming(input: any): Array<Partial<WarehouseItem>> {
  if (!input) return [];
  if (Array.isArray(input)) return input as Array<Partial<WarehouseItem>>;
  if (Array.isArray(input.items)) return input.items as Array<Partial<WarehouseItem>>;
  return [input as Partial<WarehouseItem>];
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const incoming = normalizeIncoming(body);
  if (!incoming.length) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const db = await getDb();
  const col = db.collection<User>('users');
  const user = await col.findOne({ id: String(userId) });
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const now = new Date();
  user.warehouse = Array.isArray(user.warehouse) ? user.warehouse : [];
  let inserted = 0;
  let updated = 0;
  for (const it of incoming) {
    const productId = String((it as any).productId ?? (it as any).id ?? '');
    if (!productId) continue;
    const qty = Math.max(1, Number((it as any).quantity ?? 1));
    const existing = user.warehouse.find(w => w.productId === productId);
    if (existing) {
      existing.quantity = (existing.quantity ?? 0) + qty;
      existing.updatedAt = now;
      updated += 1;
    } else {
      const id = `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      user.warehouse.push({
        id,
        productId,
        name: String((it as any).name ?? ''),
        image: String((it as any).image ?? ''),
        price: Number((it as any).price ?? 0),
        qualityId: (it as any).qualityId ? String((it as any).qualityId) : undefined,
        quantity: qty,
        obtainedAt: now,
        updatedAt: now,
      });
      inserted += 1;
    }
  }
  await col.updateOne({ id: String(userId) }, { $set: { warehouse: user.warehouse, updatedAt: now } });
  return NextResponse.json({ ok: true, inserted, updated }, { headers: { 'x-data-source': 'mongo', 'Cache-Control': 'no-store' } });
}


