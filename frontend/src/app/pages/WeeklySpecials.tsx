import { useMemo, useState } from 'react';
import { products, stores } from '../data/mockData';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tag, TrendingDown, Store, Sparkles, Lightbulb } from 'lucide-react';

export function WeeklySpecials() {
  const [selectedStore, setSelectedStore] = useState<string>('all');

  const weeklySpecials = useMemo(() => {
    const specials: Array<{
      productName: string;
      unit: string;
      storeName: string;
      regularPrice: number;
      salePrice: number;
      savings: number;
      savingsPercent: number;
    }> = [];

    products.forEach((product) => {
      product.prices.forEach((price) => {
        if (price.weeklySpecial && price.salePrice) {
          if (selectedStore === 'all' || price.storeId === selectedStore) {
            specials.push({
              productName: product.name,
              unit: product.unit,
              storeName: price.storeName,
              regularPrice: price.price,
              salePrice: price.salePrice,
              savings: price.price - price.salePrice,
              savingsPercent: ((price.price - price.salePrice) / price.price) * 100,
            });
          }
        }
      });
    });

    return specials.sort((a, b) => b.savingsPercent - a.savingsPercent);
  }, [selectedStore]);

  return (
    <div className="space-y-8">
      {/* Header - Solid High-Contrast Style */}
      <Card className="bg-orange-500 text-white p-10 relative overflow-hidden rounded-3xl border-none shadow-md">
        <img 
          src="assets/bunny.png"
          alt="Budget Bunny"
          className="absolute right-4 -bottom-4 size-40 opacity-20 -rotate-12"
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="size-10 fill-white" />
            <h1 className="text-4xl font-black tracking-tight">Hot Deals!</h1>
          </div>
          <p className="text-lg font-bold text-orange-100 uppercase tracking-wide">
            The bunny's top picks for the week
          </p>
        </div>
      </Card>

      {/* Store Filter - Balanced Row */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-black uppercase text-slate-400 tracking-widest mr-2">Filter Store:</span>
        <Button
          variant={selectedStore === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedStore('all')}
          className={`rounded-xl font-bold transition-all ${
            selectedStore === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-600'
          }`}
        >
          <Store className="size-4 mr-2" />
          All Stores
        </Button>
        {stores
          .filter((s) => s.type === 'supermarket')
          .map((store) => (
            <Button
              key={store.id}
              variant={selectedStore === store.id ? 'default' : 'outline'}
              onClick={() => setSelectedStore(store.id)}
              className={`rounded-xl font-bold transition-all ${
                selectedStore === store.id ? 'bg-orange-500 text-white border-orange-500' : 'border-slate-200 text-slate-600'
              }`}
            >
              {store.name}
            </Button>
          ))}
      </div>

      {/* Specials Grid */}
      {weeklySpecials.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {weeklySpecials.map((special, index) => (
            <Card key={index} className="p-6 bg-white border-2 border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-black text-xl text-slate-800 leading-tight">{special.productName}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-1">{special.unit}</p>
                </div>
                <div className="bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-tighter">
                  {special.savingsPercent.toFixed(0)}% Off
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Regular</span>
                  <span className="text-sm line-through text-slate-400 font-bold">
                    ${special.regularPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Bunny Price</span>
                  <span className="text-2xl font-black text-emerald-600">
                    ${special.salePrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <span className="text-xs font-black text-emerald-700 uppercase flex items-center gap-1">
                    <TrendingDown className="size-3" />
                    You Save
                  </span>
                  <span className="text-lg font-black text-emerald-700">
                    ${special.savings.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none px-3 py-1 rounded-lg font-bold">
                  {special.storeName}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-16 text-center bg-white border-2 border-dashed border-slate-200 rounded-3xl">
          <Tag className="size-16 mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 text-lg font-bold">No deals found for this store yet.</p>
        </Card>
      )}

      {/* Tips Section - Solid Amber Bento Box */}
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
            { text: 'New deals drop every Sunday' },
            { text: 'Stock up on pantry staples' },
            { text: 'Stack deals with digital coupons' },
            { text: 'Meal plan based on this list' }
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