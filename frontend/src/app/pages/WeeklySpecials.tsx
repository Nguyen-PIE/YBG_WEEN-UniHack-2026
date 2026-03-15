import { useMemo, useState } from 'react';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Store, Sparkles, Lightbulb, ImageOff } from 'lucide-react';
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

function normalizeWord(value: string): string {
  return value.trim().toLowerCase();
}

function toSingular(value: string): string {
  const word = normalizeWord(value);
  if (word.endsWith('ies') && word.length > 3) {
    return `${word.slice(0, -3)}y`;
  }
  if (word.endsWith('es') && word.length > 2) {
    return word.slice(0, -2);
  }
  if (word.endsWith('s') && word.length > 1) {
    return word.slice(0, -1);
  }
  return word;
}

function toPlural(value: string): string {
  const word = normalizeWord(value);
  if (word.endsWith('y') && word.length > 1) {
    return `${word.slice(0, -1)}ies`;
  }
  if (word.endsWith('s')) {
    return `${word}es`;
  }
  return `${word}s`;
}

function buildTermVariants(value: string): string[] {
  const normalized = normalizeWord(value);
  if (!normalized) {
    return [];
  }

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

  // Case: "$23.99"
  const directMatch = cleaned.match(/^\$(\d+(?:\.\d+)?)$/);
  if (directMatch) {
    return Number(directMatch[1]);
  }

  // Case: "60 m($0.02 per 1 m)" or "1120 sheets($0.45 per 100 sheets)"
  const quantityMatch = cleaned.match(
    /^(\d+(?:\.\d+)?)\s+[^()]+\(\$(\d+(?:\.\d+)?)\s+per\s+(\d+(?:\.\d+)?)\s+[^()]+\)$/,
  );

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
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const rows: GroceryRow[] = [];

  lines.forEach((line) => {
    if (!line.startsWith('{')) return;
    try {
      const parsed = JSON.parse(line) as Partial<GroceryRow> & { index?: unknown };
      if (parsed.index) return;
      if (typeof parsed.product_name !== 'string' || typeof parsed.store_name !== 'string') return;
      if (typeof parsed.price !== 'number' || Number.isNaN(parsed.price)) return;

      const normalizedPrice = getNormalizedPrice(parsed.price, parsed.raw_price);

      rows.push({
        product_id: parsed.product_id ?? parsed.product_name,
        product_name: parsed.product_name,
        price: normalizedPrice,
        store_name: parsed.store_name,
        category: parsed.category ?? '',
        term: parsed.term ?? '',
        image: parsed.image ?? '',
        url: parsed.url ?? '',
        raw_price: parsed.raw_price ?? '',
      });
    } catch {
      // Ignore malformed lines in data file.
    }
  });

  return rows;
}

export function WeeklySpecials() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStores, setSelectedStores] = useState<SupportedStore[]>(
    STORE_OPTIONS.map((store) => store.id),
  );

  const rows = useMemo(() => parseNdjson(collectionRaw), []);

  const toggleStore = (storeId: SupportedStore) => {
    setSelectedStores((prev) => {
      if (prev.includes(storeId)) {
        return prev.filter((id) => id !== storeId);
      }
      return [...prev, storeId];
    });
  };

  const groupedResults = useMemo(() => {
    const variants = buildTermVariants(searchTerm);
    const selectedStoreSet = new Set(selectedStores);

    const filtered = rows.filter((row) => {
      const normalizedStore = normalizeStoreName(row.store_name);
      if (!normalizedStore || !selectedStoreSet.has(normalizedStore)) {
        return false;
      }

      if (variants.length === 0) {
        return true;
      }

      const normalizedTerm = normalizeWord(row.term ?? '');
      const normalizedName = normalizeWord(row.product_name);
      return variants.some((variant) =>
        normalizedTerm === variant ||
        normalizedTerm.includes(variant) ||
        normalizedName.includes(variant),
      );
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
    <div className="space-y-8">
      <Card className="bg-orange-500 text-white p-10 relative overflow-hidden rounded-3xl border-none shadow-md">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="size-10 fill-white" />
            <h1 className="text-4xl font-black tracking-tight">Price Comparison Search</h1>
          </div>
          <p className="text-lg font-bold text-orange-100 uppercase tracking-wide">
            Search by term and compare cheapest prices with product images
          </p>
        </div>
      </Card>

      <Card className="p-5 rounded-3xl border-2 border-slate-200 bg-white">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search term"
              className="pl-10 rounded-xl border-2 border-slate-200"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-black uppercase text-slate-400 tracking-widest mr-2">Stores:</span>
            <Button
              variant="outline"
              onClick={() => setSelectedStores(STORE_OPTIONS.map((store) => store.id))}
              className="rounded-xl font-bold border-slate-200 text-slate-600"
            >
              Select All
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedStores([])}
              className="rounded-xl font-bold border-slate-200 text-slate-600"
            >
              Clear
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {STORE_OPTIONS.map((store) => {
              const selected = selectedStores.includes(store.id);
              return (
                <Button
                  key={store.id}
                  variant={selected ? 'default' : 'outline'}
                  onClick={() => toggleStore(store.id)}
                  className={`rounded-xl font-bold transition-all ${
                    selected
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {store.label}
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-500">
          {groupedResults.length} products found
        </span>
        <Button
          variant="outline"
          onClick={() => {
            setSearchTerm('');
            setSelectedStores(STORE_OPTIONS.map((store) => store.id));
          }}
          className="rounded-xl font-bold border-slate-200 text-slate-600"
        >
          Reset Filters
        </Button>
      </div>

      {groupedResults.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groupedResults.map((product) => (
            <Card key={product.key} className="p-6 bg-white border-2 border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex gap-4 mb-4">
                <div className="size-24 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                  {product.image ? (
                    <img src={product.image} alt={product.productName} className="w-full h-full object-cover" />
                  ) : (
                    <ImageOff className="size-8 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-xl text-slate-800 leading-tight">{product.productName}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {/* {product.term ? (
                      // <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-none px-3 py-1 rounded-lg font-bold">
                      //   Term: {product.term}
                      // </Badge>
                    ) : null} */}
                    {/* {product.category ? (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none px-3 py-1 rounded-lg font-bold">
                        {product.category}
                      </Badge>
                    ) : null} */}
                  </div>
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl">
                {product.offers.map((offer, index) => (
                  <div
                    key={`${offer.product_id}-${offer.store_name}-${index}`}
                    className="flex items-center justify-between gap-3 bg-white px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Store className="size-4 text-slate-400" />
                      <span className="text-sm font-bold text-slate-700 truncate">{offer.store_name}</span>
                    </div>
                    <span className={`text-base font-black ${index === 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                      ${offer.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-16 text-center bg-white border-2 border-dashed border-slate-200 rounded-3xl">
          <Search className="size-16 mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 text-lg font-bold">No products matched this term and store selection.</p>
        </Card>
      )}

      <Card className="p-8 bg-amber-50 border-2 border-amber-100 rounded-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-100 p-2 rounded-xl">
            <Lightbulb className="size-6 text-amber-600 fill-amber-600" />
          </div>
          <h3 className="font-black text-amber-900 text-xl tracking-tight">
            Pro Tips for Saving
          </h3>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-4">
          {[
                    { text: 'Use singular or plural terms, both are supported' },
                    { text: 'Products are grouped and sorted by cheapest offer' },
                    { text: 'Toggle stores to compare only where you shop' },
                    { text: 'Top row in each card is the lowest available price' }
          ].map((tip, i) => (
            <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-amber-100 shadow-sm">
              <span className="text-sm font-bold text-amber-900 leading-tight">{tip.text}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}