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

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const db = await getDb();
  const col = db.collection<User>('users');
  let user = await col.findOne({ id: String(userId) });
  if (!user) {
    const now = new Date();
    const doc: User = { id: String(userId), username: String(userId), balance: 100, warehouse: [], createdAt: now, updatedAt: now };
    await col.insertOne(doc as any);
    user = doc as any;
  }
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(user, { headers: { 'x-data-source': 'mongo', 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const db = await getDb();
  const col = db.collection<User>('users');
  const set: Partial<User> = {};
  if (typeof body.balance === 'number') {
    set.balance = Number(body.balance);
  }
  if (!Object.keys(set).length) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  set.updatedAt = new Date();
  await col.updateOne({ id: String(userId) }, { $set: set });
  const user = await col.findOne({ id: String(userId) });
  return NextResponse.json(user, { headers: { 'x-data-source': 'mongo', 'Cache-Control': 'no-store' } });
}


