import { useState } from 'react';
import { products, ProductWithPrices, stores } from '../data/mockData';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Plus, X, ShoppingBasket, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ManualListCreatorProps {
  onCreateList: (items: ProductWithPrices[]) => void;
}

export function ManualListCreator({ onCreateList }: ManualListCreatorProps) {
  const [currentItem, setCurrentItem] = useState('');
  const [searchResults, setSearchResults] = useState<ProductWithPrices[]>([]);
  const [selectedItems, setSelectedItems] = useState<ProductWithPrices[]>([]);

  const handleSearch = (query: string) => {
    setCurrentItem(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const results = products.filter((product) =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);

    setSearchResults(results);
  };

  const addItem = (product: ProductWithPrices) => {
    if (!selectedItems.find(item => item.id === product.id)) {
      setSelectedItems([...selectedItems, product]);
      toast.success(`Added ${product.name}! 🎉`);
      // Keep the search box active and clear it, so users can add multiple items quickly
      setCurrentItem('');
      setSearchResults([]);
    } else {
      toast.error('Already in your list!');
    }
  };

  const removeItem = (productId: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== productId));
    toast.success('Removed from list');
  };

  const findCheapest = () => {
    if (selectedItems.length === 0) {
      toast.error('Add some items first! 🛒');
      return;
    }

    toast.success(`Found the cheapest prices for ${selectedItems.length} items! 🐰✨`);
    onCreateList(selectedItems);
  };

  const totalCost = selectedItems.reduce((sum, product) => {
    const cheapestPrice = Math.min(...product.prices.map(p => p.salePrice || p.price));
    return sum + cheapestPrice;
  }, 0);

  return (
    <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-dashed border-orange-300 rounded-3xl">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBasket className="size-6 text-orange-600" />
        <h2 className="text-2xl font-bold text-gray-800">Create Your List</h2>
        <Sparkles className="size-5 text-yellow-500" />
      </div>
      <p className="text-gray-700 mb-6">
        Type what you need and keep adding items! We'll hop around to find the best prices! 🥕
      </p>

      {/* Search Input */}
      <div className="relative mb-6">
        <Input
          type="text"
          placeholder="Type an item... (e.g., milk, bread, eggs)"
          value={currentItem}
          onChange={(e) => handleSearch(e.target.value)}
          className="text-lg py-6 border-2 border-orange-300 focus:border-pink-400 rounded-2xl"
          autoFocus
        />
        
        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl shadow-xl border-2 border-orange-200 overflow-hidden max-h-96 overflow-y-auto">
            {searchResults.map((product) => {
              const cheapestPrice = Math.min(...product.prices.map(p => p.salePrice || p.price));
              const cheapestStore = product.prices.find(p => (p.salePrice || p.price) === cheapestPrice);
              const alreadyAdded = selectedItems.find(item => item.id === product.id);
              
              return (
                <button
                  key={product.id}
                  onClick={() => addItem(product)}
                  disabled={!!alreadyAdded}
                  className={`w-full p-4 text-left flex items-center justify-between border-b border-orange-100 last:border-0 transition-colors ${
                    alreadyAdded 
                      ? 'bg-gray-100 opacity-50 cursor-not-allowed' 
                      : 'hover:bg-pink-50'
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${cheapestPrice.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{cheapestStore?.storeName}</p>
                  </div>
                  {alreadyAdded && (
                    <Badge className="ml-2 bg-green-500 text-white border-none">✓ Added</Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <div className="mb-6 space-y-3">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            Your Items ({selectedItems.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {selectedItems.map((product) => {
              const cheapestPrice = Math.min(...product.prices.map(p => p.salePrice || p.price));
              
              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-white rounded-xl border-2 border-orange-200 shadow-sm"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.unit}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-green-600">${cheapestPrice.toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(product.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl border-2 border-purple-300">
            <span className="text-lg font-bold text-gray-800">Estimated Total:</span>
            <span className="text-2xl font-bold text-purple-700">${totalCost.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Find Cheapest Button */}
      <Button
        onClick={findCheapest}
        className="w-full py-6 text-lg bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 rounded-2xl shadow-lg hover:shadow-xl transition-all"
      >
        <Sparkles className="size-5 mr-2" />
        Find Cheapest Prices!
      </Button>
    </Card>
  );
}