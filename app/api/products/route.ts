import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { catalogItems, qualities } from '@/app/lib/catalogV2';

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

export async function GET() {
  let items = readBaseProducts();
  if (!items.length) {
    // 首次从 TS 数据导出，之后均读 JSON
    items = catalogItems.map(it => ({
      id: it.id,
      name: it.name,
      description: it.description,
      image: it.image,
      price: it.price,
      dropProbability: it.dropProbability,
      qualityId: it.qualityId,
    } as CatalogItem));
    writeBaseProducts(items);
  }
  return NextResponse.json(items);
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
      qualityId: String(body.qualityId ?? 'common'),
    };
    const list = readBaseProducts();
    const map: Record<string, CatalogItem> = {};
    for (const it of list) map[it.id] = it;
    map[payload.id] = payload;
    writeBaseProducts(Object.values(map));
    return NextResponse.json(payload, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}


