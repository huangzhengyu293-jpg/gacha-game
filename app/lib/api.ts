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

async function jsonFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { cache: 'no-store', ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
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
};


