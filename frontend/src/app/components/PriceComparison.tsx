import { useState, useEffect, useRef, useMemo } from 'react';
import { ProductWithPrices } from '../data/types';
import { searchProducts } from '../utils/api';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, Store, RefreshCcw, Loader2, ShoppingBasket, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const ALL_STORES = ['Aldi', 'Woolworths', 'IGA', 'Coles'];

export function PriceComparison() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<ProductWithPrices[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStores, setActiveStores] = useState<string[]>(ALL_STORES);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trimmedSearch = searchTerm.trim();
  const hasQuery = trimmedSearch.length >= 2;

  const fetchProducts = async (query: string) => {
    setLoading(true);
    try {
      const results = await searchProducts(query, 40);
      setProducts(results);
    } catch {
      toast.error('Could not load products – check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (trimmedSearch.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      if (trimmedSearch.length < 2) {
        setProducts([]);
        setLoading(false);
        return;
      }
      fetchProducts(trimmedSearch);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [trimmedSearch]);

  const toggleStore = (store: string) => {
    setActiveStores((prev) =>
      prev.includes(store) ? prev.filter((s) => s !== store) : [...prev, store]
    );
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.prices.some((p) => activeStores.includes(p.storeName))
    );
  }, [products, activeStores]);

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="py-16 text-center bg-transparent">
        <h1 className="text-6xl md:text-8xl font-black text-primary italic uppercase tracking-tighter leading-none">
          Price Search
        </h1>
        <p className="text-primary/60 font-black uppercase text-[10px] tracking-[0.5em] mt-6">
          Compare the cheapest prices across every aisle
        </p>
      </div>

      {/* Search & Filters */}
      <div className="max-w-4xl mx-auto px-4 space-y-10">
        <div className="relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-accent p-2 rounded-xl border-4 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
            {loading ? (
              <Loader2 className="size-6 text-primary animate-spin" />
            ) : (
              <Search className="size-6 text-primary" />
            )}
          </div>
          <Input
            placeholder="Search for a product (e.g. Milk, Noodles...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-24 pl-24 text-3xl border-4 border-primary bg-white rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(93,130,193,0.2)] focus:shadow-none transition-all font-black italic placeholder:text-primary/10"
          />
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/40 mr-2">
              Stores:
            </span>
            {ALL_STORES.map((store) => (
              <button
                key={store}
                onClick={() => toggleStore(store)}
                className={`px-6 py-2 rounded-full border-4 border-primary font-black uppercase text-xs tracking-widest transition-all ${
                  activeStores.includes(store)
                    ? 'bg-secondary text-primary shadow-[4px_4px_0px_0px_#5D82C1]'
                    : 'bg-white text-primary/30 border-primary/20 hover:border-primary'
                }`}
              >
                {store}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            onClick={() => {
              setSearchTerm('');
              setActiveStores(ALL_STORES);
            }}
            className="text-[10px] font-black uppercase tracking-widest text-primary/60 flex items-center gap-2 hover:bg-accent/20 rounded-full"
          >
            <RefreshCcw className="size-3" />
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-6">
        {loading ? (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border-4 border-primary/10 p-8 rounded-[3rem] animate-pulse flex flex-col gap-4"
              >
                <div className="aspect-square bg-primary/5 rounded-[2.5rem]" />
                <div className="h-5 bg-primary/10 rounded-full w-3/4" />
                <div className="h-4 bg-primary/5 rounded-full w-1/2" />
                <div className="h-16 bg-primary/5 rounded-[1.5rem] mt-auto" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-8 px-2">
              <p className="text-xs font-black text-primary/40 uppercase tracking-widest">
                {filteredProducts.length} Products Found
              </p>
            </div>

            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => {
                const filteredPrices = product.prices.filter((p) =>
                  activeStores.includes(p.storeName)
                );
                if (filteredPrices.length === 0) return null;

                const cheapestPrice = Math.min(
                  ...filteredPrices.map((p) => p.salePrice ?? p.price)
                );
                const bestStore = filteredPrices.find(
                  (p) => (p.salePrice ?? p.price) === cheapestPrice
                );
                const onSale = bestStore?.onSale ?? false;

                return (
                  <div
                    key={product.id}
                    className="bg-white border-4 border-primary p-8 rounded-[3rem] shadow-[14px_14px_0px_0px_rgba(93,130,193,0.15)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all flex flex-col group"
                  >
                    {/* Product image */}
                    <div className="aspect-square bg-primary/5 rounded-[2.5rem] border-2 border-primary/10 mb-6 flex flex-col items-center justify-center gap-3 p-6 group-hover:bg-accent/10 transition-colors overflow-hidden">
                      {bestStore?.image ? (
                        <img
                          src={bestStore.image}
                          alt={product.name}
                          className="object-contain w-full h-full mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`flex flex-col items-center gap-2 ${bestStore?.image ? 'hidden' : ''}`}>
                        <ShoppingBasket className="size-16 text-primary/20" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/30">
                          {product.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="font-black text-primary uppercase text-xl leading-none tracking-tighter mb-1">
                          {product.name}
                        </h3>
                        <span className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em]">
                          {product.unit}
                        </span>
                      </div>

                      {/* All store prices */}
                      <div className="space-y-2">
                        {filteredPrices.map((p) => {
                          const effectivePrice = p.salePrice ?? p.price;
                          const isCheapest = effectivePrice === cheapestPrice;
                          return (
                            <div
                              key={p.storeId}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl border-2 text-xs font-black ${
                                isCheapest
                                  ? 'border-primary bg-secondary/20 text-primary'
                                  : 'border-primary/10 text-primary/40'
                              }`}
                            >
                              <span className="uppercase tracking-widest">{p.storeName}</span>
                              <div className="flex items-center gap-2">
                                {p.onSale && p.salePrice != null && (
                                  <span className="line-through text-[9px] opacity-50">
                                    ${p.price.toFixed(2)}
                                  </span>
                                )}
                                <span className={isCheapest ? 'text-base italic tracking-tighter' : ''}>
                                  ${effectivePrice.toFixed(2)}
                                </span>
                                {isCheapest && (
                                  <span className="text-[8px] bg-primary text-white px-1.5 py-0.5 rounded-full uppercase">
                                    Best
                                  </span>
                                )}
                                {p.url && (
                                  <a
                                    href={p.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-primary/40 hover:text-primary transition-colors"
                                    title={`View at ${p.storeName}`}
                                  >
                                    <ExternalLink className="size-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Best price summary — links to cheapest store */}
                      {bestStore?.url ? (
                        <a
                          href={bestStore.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-auto flex items-center justify-between p-5 bg-secondary/10 border-4 border-primary rounded-[1.5rem] hover:bg-secondary/30 transition-colors group/link"
                        >
                          <div className="flex items-center gap-2">
                            <div className="bg-white p-1.5 rounded-lg border-2 border-primary">
                              <Store className="size-3 text-primary" />
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase text-primary tracking-widest block">
                                {bestStore.storeName}
                              </span>
                              {onSale && (
                                <span className="text-[8px] font-black uppercase text-primary/60 tracking-widest">
                                  On Sale
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-4xl font-black text-primary italic tracking-tighter">
                              ${cheapestPrice.toFixed(2)}
                            </span>
                            <ExternalLink className="size-4 text-primary/40 group-hover/link:text-primary transition-colors" />
                          </div>
                        </a>
                      ) : (
                        <div className="mt-auto flex items-center justify-between p-5 bg-secondary/10 border-4 border-primary rounded-[1.5rem]">
                          <div className="flex items-center gap-2">
                            <div className="bg-white p-1.5 rounded-lg border-2 border-primary">
                              <Store className="size-3 text-primary" />
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase text-primary tracking-widest block">
                                {bestStore?.storeName}
                              </span>
                              {onSale && (
                                <span className="text-[8px] font-black uppercase text-primary/60 tracking-widest">
                                  On Sale
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-4xl font-black text-primary italic tracking-tighter">
                            ${cheapestPrice.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!hasQuery && !loading && (
              <div className="py-40 text-center border-4 border-dashed border-primary/10 rounded-[4rem]">
                <Search className="size-16 text-primary/10 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-primary/20 uppercase italic tracking-tighter">
                  Start typing to search
                </h3>
                <p className="text-xs font-black text-primary/20 uppercase tracking-widest mt-3">
                  Enter at least two letters to see results
                </p>
              </div>
            )}
            {hasQuery && filteredProducts.length === 0 && !loading && (
              <div className="py-40 text-center border-4 border-dashed border-primary/10 rounded-[4rem]">
                <Search className="size-16 text-primary/10 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-primary/20 uppercase italic tracking-tighter">
                  No results in this aisle
                </h3>
                <p className="text-xs font-black text-primary/20 uppercase tracking-widest mt-3">
                  Try a different search term or store filter
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
