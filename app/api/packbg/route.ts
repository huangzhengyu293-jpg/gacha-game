import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/lib/mongodb';

function isLikelyUrl(v: unknown): v is string {
  return typeof v === 'string' && /^(https?:)?\/\//.test(v);
}

function collectUrlsFromValue(value: unknown, acc: Set<string>) {
  if (!value) return;
  if (Array.isArray(value)) {
    for (const item of value) collectUrlsFromValue(item, acc);
    return;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const [k, v] of Object.entries(obj)) {
      // 仅收集对象里的 url 字段（用户要求“对象的 url 字段才是图片地址”）
      if (k.toLowerCase() === 'url' && isLikelyUrl(v)) {
        acc.add(String(v));
      }
      // 继续向下遍历，处理更深层的数组/对象
      if (v && (typeof v === 'object' || Array.isArray(v))) {
        collectUrlsFromValue(v, acc);
      }
    }
    return;
  }
  // 其余类型忽略
}

export async function GET(_: NextRequest) {
  const db = await getDb();
  const col = db.collection('packbg');
  const docs = await col.find({}).toArray();
  const urls = new Set<string>();
  for (const d of docs) collectUrlsFromValue(d, urls);
  return NextResponse.json(Array.from(urls), {
    headers: { 'x-data-source': 'mongo', 'Cache-Control': 'no-store' },
  });
}


