import { useMemo, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Store, Lightbulb, ImageOff, RefreshCcw } from 'lucide-react';
import collectionRaw from '../data/collection.bulk.strict.ndjson?raw';

type SupportedStore = 'aldi' | 'woolworths' | 'iga' | 'coles';

interface GroceryRow {
  product_id: string;
  product_name: string;
  price: number;
  store_name: string;
  category?: string;
  term?: string;
  image?: string;
  url?: string;
  raw_price?: string;
}

interface ProductGroup {
  key: string;
  productName: string;
  term: string;
  category: string;
  image?: string;
  offers: GroceryRow[];
  lowestPrice: number;
}

const STORE_OPTIONS: Array<{ id: SupportedStore; label: string }> = [
  { id: 'aldi', label: 'Aldi' },
  { id: 'woolworths', label: 'Woolworths' },
  { id: 'iga', label: 'IGA' },
  { id: 'coles', label: 'Coles' },
];

// Helper functions (kept exactly as in your original file)
function normalizeWord(value: string): string { return value.trim().toLowerCase(); }
function toSingular(value: string): string {
  const word = normalizeWord(value);
  if (word.endsWith('ies') && word.length > 3) return `${word.slice(0, -3)}y`;
  if (word.endsWith('es') && word.length > 2) return word.slice(0, -2);
  if (word.endsWith('s') && word.length > 1) return word.slice(0, -1);
  return word;
}
function toPlural(value: string): string {
  const word = normalizeWord(value);
  if (word.endsWith('y') && word.length > 1) return `${word.slice(0, -1)}ies`;
  if (word.endsWith('s')) return `${word}es`;
  return `${word}s`;
}
function buildTermVariants(value: string): string[] {
  const normalized = normalizeWord(value);
  if (!normalized) return [];
  const singular = toSingular(normalized);
  const plural = toPlural(singular);
  return Array.from(new Set([normalized, singular, plural]));
}
function normalizeStoreName(value: string): SupportedStore | null {
  const normalized = normalizeWord(value);
  if (normalized.includes('aldi')) return 'aldi';
  if (normalized.includes('woolworths')) return 'woolworths';
  if (normalized === 'iga' || normalized.includes(' i g a ') || normalized.includes(' iga')) return 'iga';
  if (normalized.includes('coles')) return 'coles';
  return null;
}
function getNormalizedPrice(price: number, rawPrice?: string): number {
  if (!rawPrice) return price;
  const cleaned = rawPrice.replace(/,/g, '').trim();
  const directMatch = cleaned.match(/^\$(\d+(?:\.\d+)?)$/);
  if (directMatch) return Number(directMatch[1]);
  const quantityMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s+[^()]+\(\$(\d+(?:\.\d+)?)\s+per\s+(\d+(?:\.\d+)?)\s+[^()]+\)$/);
  if (quantityMatch) {
    const quantity = Number(quantityMatch[1]);
    const rate = Number(quantityMatch[2]);
    const baseQuantity = Number(quantityMatch[3]);
    if (!Number.isNaN(quantity) && !Number.isNaN(rate) && !Number.isNaN(baseQuantity) && baseQuantity > 0) {
      const calculated = (quantity / baseQuantity) * rate;
      return Number(calculated.toFixed(2));
    }
  }
  return price;
}
function parseNdjson(raw: string): GroceryRow[] {
  const lines = raw.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
  const rows: GroceryRow[] = [];
  lines.forEach((line) => {
    if (!line.startsWith('{')) return;
    try {
      const parsed = JSON.parse(line) as Partial<GroceryRow> & { index?: unknown };
      if (parsed.index) return;
      if (typeof parsed.product_name !== 'string' || typeof parsed.store_name !== 'string') return;
      if (typeof parsed.price !== 'number' || Number.isNaN(parsed.price)) return;
      rows.push({
        product_id: parsed.product_id ?? parsed.product_name,
        product_name: parsed.product_name,
        price: getNormalizedPrice(parsed.price, parsed.raw_price),
        store_name: parsed.store_name,
        category: parsed.category ?? '',
        term: parsed.term ?? '',
        image: parsed.image ?? '',
        url: parsed.url ?? '',
        raw_price: parsed.raw_price ?? '',
      });
    } catch { }
  });
  return rows;
}

export function WeeklySpecials() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStores, setSelectedStores] = useState<SupportedStore[]>(STORE_OPTIONS.map((store) => store.id));
  const rows = useMemo(() => parseNdjson(collectionRaw), []);

  const toggleStore = (storeId: SupportedStore) => {
    setSelectedStores((prev) => prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]);
  };

  const groupedResults = useMemo(() => {
    const variants = buildTermVariants(searchTerm);
    const selectedStoreSet = new Set(selectedStores);
    const filtered = rows.filter((row) => {
      const normalizedStore = normalizeStoreName(row.store_name);
      if (!normalizedStore || !selectedStoreSet.has(normalizedStore)) return false;
      if (variants.length === 0) return true;
      const normalizedTerm = normalizeWord(row.term ?? '');
      const normalizedName = normalizeWord(row.product_name);
      return variants.some((variant) => normalizedTerm === variant || normalizedTerm.includes(variant) || normalizedName.includes(variant));
    });
    const grouped = new Map<string, GroceryRow[]>();
    filtered.forEach((row) => {
      const key = normalizeWord(row.product_name);
      const existing = grouped.get(key) ?? [];
      existing.push(row);
      grouped.set(key, existing);
    });
    const result: ProductGroup[] = Array.from(grouped.entries()).map(([key, offers]) => {
      const sortedOffers = [...offers].sort((a, b) => a.price - b.price);
      const first = sortedOffers[0];
      return {
        key,
        productName: first.product_name,
        term: first.term ?? '',
        category: first.category ?? '',
        image: sortedOffers.find((offer) => offer.image)?.image,
        offers: sortedOffers,
        lowestPrice: first.price,
      };
    });
    return result.sort((a, b) => a.lowestPrice - b.lowestPrice);
  }, [rows, searchTerm, selectedStores]);

  return (
    <div className="space-y-12 pb-20">
      {/* 1. Header Section - Replaced Orange Banner */}
      <div className="py-16 text-center bg-transparent">
        <h1 className="text-6xl md:text-8xl font-black text-primary italic uppercase tracking-tighter leading-none">
          Price Comparison
        </h1>
        <p className="text-primary/60 font-black uppercase text-[10px] tracking-[0.5em] mt-6">
          Find the best grocery deals across every store
        </p>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="max-w-4xl mx-auto px-4 space-y-10">
        <div className="relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-accent p-2 rounded-xl border-4 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
            <Search className="size-6 text-primary" />
          </div>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search groceries..."
            className="h-24 pl-24 text-3xl border-4 border-primary bg-white rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(93,130,193,0.2)] focus:shadow-none transition-all font-black italic placeholder:text-primary/10"
          />
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/40 mr-2">Filters:</span>
            <button 
              onClick={() => setSelectedStores(STORE_OPTIONS.map((s) => s.id))}
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-secondary transition-colors"
            >
              Select All
            </button>
            <span className="text-primary/20">|</span>
            <button 
              onClick={() => setSelectedStores([])}
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-secondary transition-colors"
            >
              Clear
            </button>
            <div className="flex flex-wrap gap-2 ml-4">
              {STORE_OPTIONS.map((store) => {
                const selected = selectedStores.includes(store.id);
                return (
                  <button
                    key={store.id}
                    onClick={() => toggleStore(store.id)}
                    className={`px-6 py-2 rounded-full border-4 border-primary font-black uppercase text-xs tracking-widest transition-all ${
                      selected
                        ? 'bg-secondary text-primary shadow-[4px_4px_0px_0px_#5D82C1]'
                        : 'bg-white text-primary/30 border-primary/20'
                    }`}
                  >
                    {store.label}
                  </button>
                );
              })}
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={() => {setSearchTerm(''); setSelectedStores(STORE_OPTIONS.map(s => s.id));}}
            className="text-[10px] font-black uppercase tracking-widest text-primary/60 flex items-center gap-2 hover:bg-accent/20 rounded-full"
          >
            <RefreshCcw className="size-3" />
            Reset
          </Button>
        </div>
      </div>

      {/* 3. Results Grid */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8 flex items-end justify-between px-2">
            <p className="text-xs font-black text-primary/40 uppercase tracking-widest">
              {groupedResults.length} Products Found
            </p>
        </div>

        {groupedResults.length > 0 ? (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {groupedResults.map((product) => (
              <div key={product.key} className="bg-white border-4 border-primary p-8 rounded-[3rem] shadow-[14px_14px_0px_0px_rgba(93,130,193,0.15)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all flex flex-col group">
                <div className="aspect-square bg-primary/5 rounded-[2.5rem] border-2 border-primary/10 mb-6 flex items-center justify-center p-6 group-hover:bg-accent/10 transition-colors overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.productName} className="object-contain max-h-full mix-blend-multiply transition-transform group-hover:scale-110" />
                  ) : (
                    <ImageOff className="size-12 text-primary/20" />
                  )}
                </div>

                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="font-black text-primary uppercase text-2xl leading-none tracking-tighter mb-1">
                      {product.productName}
                    </h3>
                    <span className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em]">
                        {product.category || 'General'}
                    </span>
                  </div>

                  <div className="space-y-3 pt-6 border-t-4 border-primary/5">
                    {product.offers.map((offer, index) => (
                      <div
                        key={`${offer.product_id}-${offer.store_name}-${index}`}
                        className={`flex items-center justify-between p-4 rounded-2xl border-4 transition-all ${
                          index === 0 
                            ? 'bg-secondary/10 border-primary shadow-[4px_4px_0px_0px_rgba(93,130,193,0.1)]' 
                            : 'bg-white border-primary/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Store className="size-4 text-primary/40" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">{offer.store_name}</span>
                        </div>
                        <span className={`text-2xl font-black italic tracking-tighter ${index === 0 ? 'text-primary' : 'text-primary/40'}`}>
                          ${offer.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-40 text-center border-4 border-dashed border-primary/10 rounded-[4rem]">
             <Search className="size-16 text-primary/10 mx-auto mb-6" />
             <h3 className="text-2xl font-black text-primary/20 uppercase italic tracking-tighter">No items found</h3>
          </div>
        )}
      </div>

      {/* 4. Tips Section - Scrapbook Style */}
      <div className="max-w-4xl mx-auto px-4 mt-20">
        <div className="bg-accent/10 border-4 border-primary p-10 rounded-[3rem] shadow-[10px_10px_0px_0px_rgba(93,130,193,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <Lightbulb className="size-32" />
          </div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-accent p-2 rounded-xl border-2 border-primary">
              <Lightbulb className="size-6 text-primary" />
            </div>
            <h3 className="text-3xl font-black text-primary italic uppercase tracking-tighter">Pro Tips</h3>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Search singular or plural (milk/milks)',
              'Cheapest offer is always at the top',
              'Toggle stores to find area-specific deals',
              'Click images to see full product details'
            ].map((tip, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border-2 border-primary/10 flex items-center gap-3">
                <span className="bg-primary/5 size-2 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}