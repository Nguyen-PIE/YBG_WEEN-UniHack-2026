import { useMemo, useState } from 'react';
import { products, stores } from '../data/mockData';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tag, TrendingDown, Store } from 'lucide-react';

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

    // Sort by savings percent (highest first)
    return specials.sort((a, b) => b.savingsPercent - a.savingsPercent);
  }, [selectedStore]);

  const totalSavings = useMemo(() => {
    return weeklySpecials.reduce((sum, special) => sum + special.savings, 0);
  }, [weeklySpecials]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-orange-400 to-red-400 text-white p-10 relative overflow-hidden rounded-3xl border-none shadow-2xl">
        <img 
          // src={bunnyIcon}
          alt="Budget Bunny"
          className="absolute right-4 top-4 size-36 opacity-40"
        />
        <div className="flex items-center gap-3 mb-3">
          <Tag className="size-10" />
          <h1 className="text-4xl font-black drop-shadow-lg">Hot Deals! 🔥</h1>
        </div>
        <p className="text-xl opacity-95 font-medium">
          Check out this week's best sales and save big! 💰
        </p>
      </Card>

      {/* Store Filter */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant={selectedStore === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedStore('all')}
          className={selectedStore === 'all' ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl' : 'rounded-xl border-2'}
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
              className={selectedStore === store.id ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl' : 'rounded-xl border-2'}
            >
              {store.name}
            </Button>
          ))}
      </div>

      {/* Specials Grid */}
      {weeklySpecials.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {weeklySpecials.map((special, index) => (
            <Card key={index} className="p-5 hover:shadow-xl transition-shadow bg-white border-2 border-orange-200 rounded-2xl">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800">{special.productName}</h3>
                  <p className="text-sm text-gray-600">{special.unit}</p>
                  <Badge variant="outline" className="mt-2 border-orange-300 text-orange-700 rounded-lg">
                    {special.storeName}
                  </Badge>
                </div>
                <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-none rounded-xl px-3 py-1 text-sm font-bold">
                  {special.savingsPercent.toFixed(0)}% OFF
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Was:</span>
                  <span className="text-sm line-through text-gray-500 font-medium">
                    ${special.regularPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800">Now:</span>
                  <span className="text-2xl font-black text-green-600">
                    ${special.salePrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t-2 border-dashed border-green-200">
                  <span className="text-sm font-bold text-green-700 flex items-center gap-1">
                    <TrendingDown className="size-4" />
                    Save:
                  </span>
                  <span className="text-lg font-black text-green-700">
                    ${special.savings.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-3xl">
          <Tag className="size-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg font-medium">No weekly specials found for the selected store.</p>
        </Card>
      )}

      {/* Tips Section */}
      <Card className="p-8 bg-gradient-to-br from-yellow-100 to-amber-100 border-none rounded-3xl shadow-lg">
        <h3 className="font-black text-amber-900 mb-4 text-xl flex items-center gap-2">
          💡 Pro Tips for Saving!
        </h3>
        <ul className="space-y-3 text-sm text-amber-900">
          <li className="flex items-start gap-2">
            <span className="text-lg">🗓️</span>
            <span>Check every Sunday when fresh deals drop!</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg">📦</span>
            <span>Stock up on stuff that won't go bad when it's on sale</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg">✂️</span>
            <span>Stack deals with coupons for mega savings!</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg">🍳</span>
            <span>Plan your meals around what's on sale this week</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}