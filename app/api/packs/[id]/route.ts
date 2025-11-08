import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { getGlowColorFromProbability, qualities } from '@/app/lib/catalogV2';

type LegacyItem = {
  id: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  probability: number;
  backlightColor: string;
};

type LegacyPack = {
  id: string;
  title: string;
  image: string;
  price: number;
  itemCount: number;
  items: LegacyItem[];
};

function getBaseStorePath() {
  if (process.env.VERCEL) return '/tmp/base_packs.json';
  const p = path.join(process.cwd(), '.data');
  try { fs.mkdirSync(p, { recursive: true }); } catch {}
  return path.join(p, 'base_packs.json');
}

function readBasePacks(): LegacyPack[] {
  const file = getBaseStorePath();
  try {
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data as LegacyPack[];
    return [];
  } catch {
    return [];
  }
}

function writeBasePacks(packs: LegacyPack[]) {
  const file = getBaseStorePath();
  try {
    fs.writeFileSync(file, JSON.stringify(packs, null, 2), 'utf8');
  } catch {}
}

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const list = readBasePacks();
  const found = list.find(p => p.id === id);
  if (!found) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(found);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const patch = await req.json();
    const list = readBasePacks();
    const { id } = await context.params;
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const prev = list[idx];
    const next: LegacyPack = {
      ...prev,
      ...('title' in patch ? { title: String(patch.title) } : {}),
      ...('image' in patch ? { image: String(patch.image) } : {}),
      ...('price' in patch ? { price: Number(patch.price) } : {}),
      ...('items' in patch ? {
        items: Array.isArray(patch.items) ? patch.items.map((it: any) => ({
          id: it.id ?? `item_${Date.now()}`,
          name: it.name,
          description: it.description,
          image: it.image,
          price: Number(it.price),
          probability: Number(it.dropProbability ?? it.probability ?? 0),
          backlightColor: getGlowColorFromProbability(Number(it.dropProbability ?? it.probability ?? 0)),
        })) : prev.items
      } : {}),
    };
    next.itemCount = next.items.length;
    list[idx] = next;
    writeBasePacks(list);
    return NextResponse.json(next);
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const list = readBasePacks();
  const { id } = await context.params;
  const idx = list.findIndex(p => p.id === id);
  if (idx === -1) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  list.splice(idx, 1);
  writeBasePacks(list);
  return NextResponse.json({ ok: true });
}


