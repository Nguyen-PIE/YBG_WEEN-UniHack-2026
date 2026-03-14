import { useState, useMemo } from 'react';
import { products, ProductWithPrices, stores } from '../data/mockData';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { MapPin, TrendingDown } from 'lucide-react';

interface PriceComparisonProps {
  initialItems?: ProductWithPrices[];
}

export function PriceComparison({ initialItems }: PriceComparisonProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    initialItems?.map((p) => p.id) || []
  );
  const [selectedArea, setSelectedArea] = useState<string>('all');

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const selectedProductsData = useMemo(() => {
    return products.filter((p) => selectedProducts.includes(p.id));
  }, [selectedProducts]);

  const bestPrices = useMemo(() => {
    return selectedProductsData.map((product) => {
      const prices = product.prices.map((price) => ({
        ...price,
        finalPrice: price.salePrice || price.price,
      }));
      const cheapest = prices.reduce((min, curr) =>
        curr.finalPrice < min.finalPrice ? curr : min
      );
      return { product, cheapest, allPrices: prices };
    });
  }, [selectedProductsData]);

  const totalSavings = useMemo(() => {
    return bestPrices.reduce((total, item) => {
      const allPrices = item.allPrices.map((p) => p.finalPrice);
      const maxPrice = Math.max(...allPrices);
      const minPrice = Math.min(...allPrices);
      return total + (maxPrice - minPrice);
    }, 0);
  }, [bestPrices]);

  const totalCost = useMemo(() => {
    return bestPrices.reduce((total, item) => total + item.cheapest.finalPrice, 0);
  }, [bestPrices]);

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Price Comparison</h2>
          <p className="text-sm text-gray-600 mt-1">
            Select items to compare prices across stores
          </p>
        </div>
        {selectedProducts.length > 0 && (
          <div className="text-right">
            <p className="text-sm text-gray-600">Best Total</p>
            <p className="text-2xl font-bold text-green-600">${totalCost.toFixed(2)}</p>
            {totalSavings > 0 && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingDown className="size-3" />
                Save ${totalSavings.toFixed(2)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Area Filter */}
      <div className="mb-6">
        <Label className="flex items-center gap-2 mb-2">
          <MapPin className="size-4" />
          Filter by Area
        </Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedArea === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedArea('all')}
          >
            All Areas
          </Button>
          {stores
            .filter((s) => s.type === 'supermarket')
            .map((store) => (
              <Button
                key={store.id}
                variant={selectedArea === store.location ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedArea(store.location)}
              >
                {store.location}
              </Button>
            ))}
        </div>
      </div>

      {/* Product Selection */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Select Products</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className="flex items-center gap-2">
              <Checkbox
                id={product.id}
                checked={selectedProducts.includes(product.id)}
                onCheckedChange={() => toggleProduct(product.id)}
              />
              <Label htmlFor={product.id} className="cursor-pointer text-sm">
                {product.name} ({product.unit})
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Comparison Results */}
      {selectedProducts.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Best Prices</h3>
          {bestPrices.map(({ product, cheapest, allPrices }) => (
            <Card key={product.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium">{product.name}</h4>
                  <p className="text-sm text-gray-600">{product.unit}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    ${cheapest.finalPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600">{cheapest.storeName}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {allPrices.map((price) => {
                  const isCheapest = price.storeId === cheapest.storeId;
                  return (
                    <Badge
                      key={price.storeId}
                      variant={isCheapest ? 'default' : 'outline'}
                      className={isCheapest ? 'bg-green-600' : ''}
                    >
                      {price.storeName}: ${price.finalPrice.toFixed(2)}
                      {price.onSale && ' 🏷️'}
                    </Badge>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedProducts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>Select products above to compare prices</p>
        </div>
      )}
    </Card>
  );
}
