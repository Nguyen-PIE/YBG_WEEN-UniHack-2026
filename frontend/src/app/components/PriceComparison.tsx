import { useState, useMemo } from 'react';
import { products, ProductWithPrices, stores } from '../data/mockData';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Search, MapPin, TrendingDown, Store, RefreshCcw } from 'lucide-react';

interface PriceComparisonProps {
  initialItems?: ProductWithPrices[];
}

export function PriceComparison({ initialItems }: PriceComparisonProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [activeStores, setActiveStores] = useState<string[]>(['Aldi', 'Woolworths', 'IGA', 'Coles']);

  // Toggle store filters
  const toggleStore = (storeName: string) => {
    setActiveStores(prev => 
      prev.includes(storeName) 
        ? prev.filter(s => s !== storeName) 
        : [...prev, storeName]
    );
  };

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const hasSelectedStore = product.prices.some(p => activeStores.includes(p.storeName));
      return matchesSearch && hasSelectedStore;
    });
  }, [searchTerm, activeStores]);

  return (
    <div className="space-y-12 pb-20">
      {/* 1. EDITORIAL HEADER (Replaces the Orange Banner) */}
      <div className="py-16 text-center bg-transparent">
        <h1 className="text-6xl md:text-8xl font-black text-primary italic uppercase tracking-tighter leading-none">
          Price Search
        </h1>
        <p className="text-primary/60 font-black uppercase text-[10px] tracking-[0.5em] mt-6">
          Compare the cheapest prices across every aisle
        </p>
      </div>

      {/* 2. CHUNKY SEARCH & FILTERS */}
      <div className="max-w-4xl mx-auto px-4 space-y-10">
        <div className="relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-accent p-2 rounded-xl border-4 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
            <Search className="size-6 text-primary" />
          </div>
          <Input 
            placeholder="Search for a term (e.g. Milk, Noodle...)" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-24 pl-24 text-3xl border-4 border-primary bg-white rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(93,130,193,0.2)] focus:shadow-none transition-all font-black italic placeholder:text-primary/10"
          />
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/40 mr-2">Stores:</span>
            {['Aldi', 'Woolworths', 'IGA', 'Coles'].map((store) => (
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
            onClick={() => {setSearchTerm(''); setActiveStores(['Aldi', 'Woolworths', 'IGA', 'Coles']);}}
            className="text-[10px] font-black uppercase tracking-widest text-primary/60 flex items-center gap-2 hover:bg-accent/20 rounded-full"
          >
            <RefreshCcw className="size-3" />
            Reset Filters
          </Button>
        </div>
      </div>

      {/* 3. PRODUCT GRID */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8 flex items-end justify-between px-2">
            <p className="text-xs font-black text-primary/40 uppercase tracking-widest">
              {filteredProducts.length} Products Found
            </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const cheapestPrice = Math.min(...product.prices.map(p => p.salePrice || p.price));
            const bestStore = product.prices.find(p => (p.salePrice || p.price) === cheapestPrice);

            return (
              <div 
                key={product.id} 
                className="bg-white border-4 border-primary p-8 rounded-[3rem] shadow-[14px_14px_0px_0px_rgba(93,130,193,0.15)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all flex flex-col group"
              >
                {/* Product Image Sticker */}
                <div className="aspect-square bg-primary/5 rounded-[2.5rem] border-2 border-primary/10 mb-6 flex items-center justify-center p-6 group-hover:bg-accent/10 transition-colors">
                  <img src={product.image} alt={product.name} className="object-contain max-h-full mix-blend-multiply" />
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
                  
                  {/* Price Tag Bar */}
                  <div className="mt-auto flex items-center justify-between p-5 bg-secondary/10 border-4 border-primary rounded-[1.5rem] relative overflow-hidden">
                    {/* Tiny decorative background circle */}
                    <div className="absolute -right-2 -bottom-2 size-12 bg-secondary/20 rounded-full blur-xl" />
                    
                    <div className="flex items-center gap-2 relative z-10">
                      <div className="bg-white p-1.5 rounded-lg border-2 border-primary">
                         <Store className="size-3 text-primary" />
                      </div>
                      <span className="text-[10px] font-black uppercase text-primary tracking-widest">
                        {bestStore?.storeName}
                      </span>
                    </div>
                    
                    <span className="text-4xl font-black text-primary italic tracking-tighter relative z-10">
                      ${cheapestPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-40 text-center border-4 border-dashed border-primary/10 rounded-[4rem]">
             <Search className="size-16 text-primary/10 mx-auto mb-6" />
             <h3 className="text-2xl font-black text-primary/20 uppercase italic tracking-tighter">No results in this aisle</h3>
          </div>
        )}
      </div>
    </div>
  );
}