import { useState } from 'react';
import { ProductWithPrices } from '../data/mockData';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Plus, X, ShoppingBasket, Sparkles, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ManualListCreatorProps {
  onCreateList: (items: ProductWithPrices[]) => void;
}

export function ManualListCreator({ onCreateList }: ManualListCreatorProps) {
  const [currentItem, setCurrentItem] = useState('');
  const [searchResults, setSearchResults] = useState<ProductWithPrices[]>([]);
  const [selectedItems, setSelectedItems] = useState<ProductWithPrices[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Added for backend call


  const handleSearch = (query: string) => {
    // ... (keep your existing handleSearch logic)
    setCurrentItem(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    // (Filtering from mockData for the UI dropdown)
    const results = (window as any).mockProducts?.filter((product: any) =>
      product.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8) || [];
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

  // --- BACKEND CALL INTEGRATION ---
  const findCheapest = async () => {
    if (selectedItems.length === 0) {
      toast.error('Add some items first! 🛒');
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading("Bunny is checking store prices...");

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/search-prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: selectedItems.map(i => i.name)
        }),
      });

      if (!response.ok) throw new Error("Backend search failed");

      const data = await response.json();
      
      // Send the optimized data back to the parent
      onCreateList(data.optimized_items || selectedItems);
      toast.success(`Found the best local deals! 🐰✨`, { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error("Couldn't reach the burrow. Is the Python server on?", { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
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
          <h2 className="text-2xl font-black text-slate-800 tracking-tight font-display">Create Your List</h2>
        </div>
        <p className="text-slate-500 font-medium">
          Add items manually and we'll compare area prices for you.
        </p>
      </div>

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
          disabled={isLoading}
          className="h-14 text-lg border-2 border-slate-100 bg-slate-50 rounded-2xl focus:border-orange-500 transition-colors"
        />
        
        {/* Dropdown logic stays here... */}
        {searchResults.length > 0 && (
          <div className="absolute z-20 w-full mt-2 bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden">
            {searchResults.map((product) => (
               <button
               key={product.id}
               onClick={() => addItem(product)}
               className="w-full p-4 text-left flex items-center justify-between border-b border-slate-100 hover:bg-orange-50 transition-colors"
             >
               <div className="flex-1">
                 <p className="font-bold text-slate-800">{product.name}</p>
                 <p className="text-[10px] font-black text-slate-400 uppercase">{product.unit}</p>
               </div>
               <Plus className="size-4 text-orange-600" />
             </button>
            ))}
          </div>
        )}
      </div>

      {selectedItems.length > 0 && (
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Shopping Bag</h3>
              <button onClick={() => setSelectedItems([])} className="text-[10px] font-black text-red-500 uppercase hover:underline">Clear All</button>
          </div>
          
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {selectedItems.map((product) => (
               <div key={product.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{product.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{product.unit}</p>
                  </div>
                  <button onClick={() => removeItem(product.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <X className="size-5" />
                  </button>
               </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-5 bg-slate-800 rounded-2xl">
            <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">Estimated Total</span>
            <span className="text-2xl font-black text-white">${totalCost.toFixed(2)}</span>
          </div>
        </div>
      )}

      <Button
        onClick={findCheapest}
        disabled={selectedItems.length === 0 || isLoading}
        className="w-full h-16 text-lg font-black bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        {isLoading ? "Comparing Stores..." : "Find Cheapest Store"}
      </Button>
    </Card>
  );
}