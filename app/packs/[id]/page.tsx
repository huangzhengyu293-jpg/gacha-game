import { notFound } from 'next/navigation';
import { packMap, getProductsByPack, packs } from '../../lib/packs';
import ProductCard from './ProductCard';

export default async function PackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: currentId } = await params;
  const pack = packMap[currentId] || packs.find(p => p.id === currentId);
  if (!pack) return notFound();
  const items = getProductsByPack(pack.id);

  return (
    <div className="w-full pb-12">
      <div className="flex gap-8 w-full max-w-[1280px] px-4 mx-auto">
        <div className="flex-1 w-full min-w-0">
          <div className="self-stretch items-stretch space-y-3">
            <div className="flex items-center gap-4 py-3 flex-1 z-10 relative">
              <div className="relative h-14 w-9" style={{ zIndex: 1 }}>
                <img
                  alt={pack.title}
                  loading="lazy"
                  decoding="async"
                  src={`${pack.image}?tr=w-3840,c-at_max`}
                  style={{ position: 'absolute', height: '100%', width: '100%', inset: 0, objectFit: 'contain', color: 'transparent' }}
                />
              </div>
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-extrabold" style={{ color: '#FAFAFA' }}>{pack.title} - ${pack.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md disabled:pointer-events-none interactive-focus relative bg-transparent font-bold select-none size-10 min-h-10 min-w-10 max-h-10 max-w-10 transition-opacity duration-100 ease-in-out"
                    aria-label="favorite"
                    style={{ color: '#7A8084' }}
                  >
                    <div className="flex justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    </div>
                  </button>
                </div>
                <span className="font-semibold" style={{ color: '#7A8084' }}>{items.length} 个物品</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {items.map((prod) => (
                <ProductCard key={prod.id} prod={prod} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

