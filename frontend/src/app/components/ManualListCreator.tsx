import { useState } from 'react';
import { products, ProductWithPrices, stores } from '../data/mockData';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Plus, X, ShoppingBasket, Sparkles, Search } from 'lucide-react';
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
    <Card className="p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBasket className="size-6 text-orange-500 fill-orange-500" />
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Create Your List</h2>
        </div>
        <p className="text-slate-500 font-medium">
          Add items manually and we'll compare area prices for you.
        </p>
      </div>

      {/* Search Input Area */}
      <div className="relative mb-8">
        <div className="flex items-center gap-2 mb-2">
            <Search className="size-3 text-slate-400" />
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Find Item</span>
        </div>
        <Input
          type="text"
          placeholder="e.g., Milk, Bread, Avocado..."
          value={currentItem}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-14 text-lg border-2 border-slate-100 bg-slate-50 rounded-2xl focus:border-orange-500 focus:ring-0 transition-colors"
          autoFocus
        />
        
        {/* Search Results Dropdown - Flat Style */}
        {searchResults.length > 0 && (
          <div className="absolute z-20 w-full mt-2 bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden max-h-96 overflow-y-auto">
            {searchResults.map((product) => {
              const cheapestPrice = Math.min(...product.prices.map(p => p.salePrice || p.price));
              const cheapestStore = product.prices.find(p => (p.salePrice || p.price) === cheapestPrice);
              const alreadyAdded = selectedItems.find(item => item.id === product.id);
              
              return (
                <button
                  key={product.id}
                  onClick={() => addItem(product)}
                  disabled={!!alreadyAdded}
                  className={`w-full p-4 text-left flex items-center justify-between border-b border-slate-100 last:border-0 transition-colors ${
                    alreadyAdded 
                      ? 'bg-slate-50 opacity-50 cursor-not-allowed' 
                      : 'hover:bg-orange-50'
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{product.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{product.unit}</p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                        <p className="font-black text-emerald-600">${cheapestPrice.toFixed(2)}</p>
                        <p className="text-[10px] font-bold text-slate-400">{cheapestStore?.storeName}</p>
                    </div>
                    {alreadyAdded ? (
                         <Badge className="bg-emerald-100 text-emerald-700 border-none rounded-lg px-2 py-0.5">✓</Badge>
                    ) : (
                        <div className="bg-orange-100 p-1 rounded-lg">
                            <Plus className="size-4 text-orange-600" />
                        </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Items - Flat List */}
      {selectedItems.length > 0 && (
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Shopping Bag ({selectedItems.length})
              </h3>
              <button 
                onClick={() => setSelectedItems([])}
                className="text-[10px] font-black text-red-500 uppercase hover:underline"
              >
                Clear All
              </button>
          </div>
          
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {selectedItems.map((product) => {
              const cheapestPrice = Math.min(...product.prices.map(p => p.salePrice || p.price));
              
              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100"
                >
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{product.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{product.unit}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-emerald-600">${cheapestPrice.toFixed(2)}</span>
                    <button
                      onClick={() => removeItem(product.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Bar - Solid Bento Box */}
          <div className="flex items-center justify-between p-5 bg-slate-800 rounded-2xl shadow-inner">
            <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">Estimated Total</span>
            <span className="text-2xl font-black text-white">${totalCost.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Final Action Button */}
      <Button
        onClick={findCheapest}
        disabled={selectedItems.length === 0}
        className="w-full h-16 text-lg font-black bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <Sparkles className="size-5 fill-white" />
        Find Cheapest Store
      </Button>
    </Card>
  );
}