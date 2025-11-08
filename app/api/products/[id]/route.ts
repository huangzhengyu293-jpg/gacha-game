import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';

type CatalogItem = {
  id: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  dropProbability: number;
  qualityId: string;
};

function getBaseProductsPath() {
  if (process.env.VERCEL) return '/tmp/base_products.json';
  const p = path.join(process.cwd(), '.data');
  try { fs.mkdirSync(p, { recursive: true }); } catch {}
  return path.join(p, 'base_products.json');
}

function readBaseProducts(): CatalogItem[] {
  const file = getBaseProductsPath();
  try {
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data as CatalogItem[];
    return [];
  } catch {
    return [];
  }
}

function writeBaseProducts(items: CatalogItem[]) {
  const file = getBaseProductsPath();
  try {
    fs.writeFileSync(file, JSON.stringify(items, null, 2), 'utf8');
  } catch {}
}

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const list = readBaseProducts();
  const { id } = await context.params;
  const found = list.find(p => p.id === id);
  if (!found) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(found);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const patch = await req.json();
    const list = readBaseProducts();
    const { id } = await context.params;
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const prev = list[idx];
    const next: CatalogItem = {
      ...prev,
      ...patch,
      id: prev.id,
      price: Number(patch.price ?? prev.price),
      dropProbability: Number(patch.dropProbability ?? prev.dropProbability),
    };
    list[idx] = next;
    writeBaseProducts(list);
    return NextResponse.json(next);
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const list = readBaseProducts();
  const { id } = await context.params;
  const idx = list.findIndex(p => p.id === id);
  if (idx === -1) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  list.splice(idx, 1);
  writeBaseProducts(list);
  return NextResponse.json({ ok: true });
}


