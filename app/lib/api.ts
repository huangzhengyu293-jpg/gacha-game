export type CatalogItem = {
  id: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  dropProbability: number;
  qualityId: string;
};

export type CatalogPack = {
  id: string;
  title: string;
  image: string;
  price: number;
  itemCount: number;
  items: CatalogItem[];
};

export type WarehouseItem = {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  qualityId?: string;
  quantity: number;
  obtainedAt: string;
  updatedAt?: string;
};

async function jsonFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { cache: 'no-store', ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  // auth - 通过Next.js API路由代理，避免CORS问题
  register: (payload: { name: string; email: string; password: string }) =>
    jsonFetch<{ ok: true; user?: { id: string; name: string; email: string } }>('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  // packs
  getPacks: () => jsonFetch<CatalogPack[]>('/api/packs'),
  getPackById: async (id: string) => {
    const all = await jsonFetch<CatalogPack[]>('/api/packs');
    return all.find(p => p.id === id);
  },
  createPack: (payload: { title: string; image: string; price: number; items: CatalogItem[]; id?: string; }) =>
    jsonFetch<CatalogPack>('/api/packs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  updatePack: (id: string, patch: Partial<Omit<CatalogPack, 'id'>>) =>
    jsonFetch<CatalogPack>(`/api/packs/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }),
  deletePack: (id: string) => jsonFetch<{ ok: true }>(`/api/packs/${id}`, { method: 'DELETE' }),

  // products
  getProducts: () => jsonFetch<CatalogItem[]>('/api/products'),
  getProductById: async (id: string) => {
    const all = await jsonFetch<CatalogItem[]>('/api/products');
    return all.find(p => p.id === id);
  },
  createProduct: (payload: CatalogItem) =>
    jsonFetch<CatalogItem>('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  updateProduct: (id: string, patch: Partial<CatalogItem>) =>
    jsonFetch<CatalogItem>(`/api/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }),
  deleteProduct: (id: string) => jsonFetch<{ ok: true }>(`/api/products/${id}`, { method: 'DELETE' }),

  // pack backgrounds (flat url list)
  getPackBackgroundUrls: () => jsonFetch<string[]>('/api/packbg'),

  // user & warehouse embedded
  getCurrentUser: () => jsonFetch<{ id: string; username: string; balance: number; warehouse: WarehouseItem[] }>('/api/user'),
  updateUser: (patch: Partial<{ balance: number }>) =>
    jsonFetch<{ id: string; username: string; balance: number; warehouse: WarehouseItem[] }>(`/api/user`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }),

  getUserWarehouse: () => jsonFetch<WarehouseItem[]>('/api/user/warehouse'),
  addUserWarehouseItems: (items: Array<Partial<WarehouseItem>>) =>
    jsonFetch<{ ok: true }>('/api/user/warehouse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    }),
  getUserWarehouseItem: (id: string) => jsonFetch<WarehouseItem>(`/api/user/warehouse/${id}`),
  updateUserWarehouseItem: (id: string, patch: Partial<WarehouseItem>) =>
    jsonFetch<WarehouseItem>(`/api/user/warehouse/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }),
  deleteUserWarehouseItem: (id: string) => jsonFetch<{ ok: true }>(`/api/user/warehouse/${id}`, { method: 'DELETE' }),
  sellUserWarehouseItems: (items: Array<{ id: string; count?: number }>) =>
    jsonFetch<{ ok: true; sold: number; gained: number; balance: number }>(`/api/user/warehouse/sell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    }),

  // lottery collect -> add to warehouse
  collectLotteryItems: (items: Array<Partial<WarehouseItem>>) =>
    jsonFetch<{ ok: true; inserted: number; updated: number }>('/api/user/warehouse/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    }),
};


