import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs';
import { getAllCatalogPacks, getGlowColorFromProbability, qualities } from '@/app/lib/catalogV2';

type LegacyItem = {
  id: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  probability: number; // 0-1 或 0-100 皆可
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

function getUserStorePath() {
  if (process.env.VERCEL) return '/tmp/user_packs.json';
  const p = path.join(process.cwd(), '.data');
  try { fs.mkdirSync(p, { recursive: true }); } catch {}
  return path.join(p, 'user_packs.json');
}

function getBaseStorePath() {
  if (process.env.VERCEL) return '/tmp/base_packs.json';
  const p = path.join(process.cwd(), '.data');
  try { fs.mkdirSync(p, { recursive: true }); } catch {}
  return path.join(p, 'base_packs.json');
}

function readUserPacks(): LegacyPack[] {
  const file = getUserStorePath();
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

function writeUserPacks(packs: LegacyPack[]) {
  const file = getUserStorePath();
  try {
    fs.writeFileSync(file, JSON.stringify(packs, null, 2), 'utf8');
  } catch {}
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

const colorToQualityId: Record<string, string> = Object.fromEntries(
  qualities.map(q => [q.color, q.id])
);

function legacyItemFromCatalogLike(item: {
  id: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  dropProbability: number;
}): LegacyItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    image: item.image,
    price: item.price,
    probability: item.dropProbability,
    backlightColor: getGlowColorFromProbability(item.dropProbability),
  };
}

function toCatalogItem(item: LegacyItem) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    image: item.image,
    price: item.price,
    dropProbability: item.probability,
    qualityId: colorToQualityId[item.backlightColor] ?? 'common',
  };
}

function toCatalogPack(p: LegacyPack) {
  return {
    id: p.id,
    title: p.title,
    image: p.image,
    price: p.price,
    itemCount: p.itemCount,
    items: (p.items || []).map(toCatalogItem),
  };
}

export async function GET() {
  // 读取基础数据（JSON 优先；若缺失则从 TS 构造一次并落盘）
  let baseLegacy = readBasePacks();
  if (!baseLegacy.length) {
    const fromTs = getAllCatalogPacks();
    baseLegacy = fromTs.map(p => ({
      id: p.id,
      title: p.title,
      image: p.image,
      price: p.price,
      itemCount: p.itemCount,
      items: (p.items || []).map(it => ({
        id: it.id,
        name: it.name,
        description: it.description,
        image: it.image,
        price: it.price,
        probability: it.dropProbability,
        backlightColor: getGlowColorFromProbability(it.dropProbability),
      })),
    }));
  }
  // 兼容迁移：若 user_packs.json 存在，则与 base 合并后写回 base，并优先后者覆盖同 id
  const legacyUser = readUserPacks();
  if (legacyUser.length) {
    // 以 baseLegacy 为基础，存在同 id 则就地更新；不存在的用户礼包插入到列表头部，确保“新建在最前”
    const byId = new Map<string, number>();
    baseLegacy.forEach((p, idx) => byId.set(p.id, idx));
    const prepend: LegacyPack[] = [];
    for (const u of legacyUser) {
      if (byId.has(u.id)) {
        baseLegacy[byId.get(u.id)!] = u;
      } else {
        prepend.push(u);
      }
    }
    baseLegacy = [...prepend, ...baseLegacy];
    writeBasePacks(baseLegacy);
  } else {
    // 确保 base 文件存在
    writeBasePacks(baseLegacy);
  }
  const base = baseLegacy.map(toCatalogPack);
  return NextResponse.json(base);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, image, price, items } = body || {};
    if (!title || !image || typeof price !== 'number' || !Array.isArray(items)) {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }
    const legacyItems: LegacyItem[] = items.map((it: any) => legacyItemFromCatalogLike({
      id: it.id || `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: it.name,
      description: it.description,
      image: it.image,
      price: Number(it.price),
      dropProbability: Number(it.dropProbability ?? it.probability ?? 0),
    }));
    const packId = id || `user_pack_${Date.now()}`;
    const legacyPack: LegacyPack = {
      id: packId,
      title: String(title),
      image: String(image),
      price: Number(price),
      itemCount: legacyItems.length,
      items: legacyItems,
    };
    const current = readBasePacks();
    // 新建直接插入到数组第一个；若同 id 已存在则更新并移到首位
    const filtered = current.filter(p => p.id !== legacyPack.id);
    const merged = [legacyPack, ...filtered];
    writeBasePacks(merged);
    return NextResponse.json(toCatalogPack(legacyPack), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}


