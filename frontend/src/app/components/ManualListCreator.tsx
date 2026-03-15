import { useState } from 'react';
import { ProductWithPrices } from '../data/mockData';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ShoppingBasket, Search, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface ManualListCreatorProps {
  onCreateList: (items: ProductWithPrices[]) => void;
}

export function ManualListCreator({ onCreateList }: ManualListCreatorProps) {
  const [currentItem, setCurrentItem] = useState('');
  const [searchResults, setSearchResults] = useState<ProductWithPrices[]>([]);
  const [selectedItems, setSelectedItems] = useState<ProductWithPrices[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const findCheapest = async () => {
    if (selectedItems.length === 0) {
      toast.error('Add some items first! 🛒');
      return;
    }
    setIsLoading(true);
    const loadingToast = toast.loading("Bunny is checking store prices...");
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/manual-list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selectedItems.map(i => i.name) }),
      });
      if (!response.ok) throw new Error("Backend failed");
      const data = await response.json();
      onCreateList(data.optimized_items || selectedItems);
      toast.success(`Found the best deals! 🐰✨`, { id: loadingToast });
    } catch (error) {
      toast.error("Couldn't reach the burrow!", { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  const totalCost = selectedItems.reduce((sum, product) => {
    const cheapestPrice = Math.min(...product.prices.map(p => p.salePrice || p.price));
    return sum + cheapestPrice;
  }, 0);

  return (
    <div className="p-8 bg-transparent">
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h2 className="text-5xl font-black text-primary italic uppercase tracking-tighter">
            Create Your List
          </h2>
        </div>
        <p className="text-primary/60 font-black uppercase text-[10px] tracking-[0.3em]">
          Add items manually & compare area prices
        </p>
      </div>

      <div className="relative mb-12 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-4 px-2">
            <div className="bg-accent p-1.5 rounded-lg border-2 border-primary">
                <Search className="size-4 text-primary" />
            </div>
            <span className="text-[10px] font-black uppercase text-primary tracking-widest">Find Item</span>
        </div>
        <Input
          type="text"
          placeholder="e.g., Milk, Bread, Avocado..."
          value={currentItem}
          onChange={(e) => handleSearch(e.target.value)}
          disabled={isLoading}
          className="h-16 text-xl border-4 border-primary bg-white rounded-2xl focus:ring-0 font-bold placeholder:text-primary/20"
        />
        
        {/* Dropdown Results */}
        {searchResults.length > 0 && (
          <div className="absolute z-20 w-full mt-3 bg-white rounded-3xl shadow-[10px_10px_0px_0px_#5D82C1] border-4 border-primary overflow-hidden">
            {searchResults.map((product) => (
               <button
               key={product.id}
               onClick={() => addItem(product)}
               className="w-full p-6 text-left flex items-center justify-between border-b-2 border-primary/10 hover:bg-accent/30 transition-colors group"
             >
               <div>
                 <p className="font-black text-primary text-xl uppercase tracking-tight">{product.name}</p>
                 <p className="text-xs font-black text-primary/40 uppercase tracking-widest">{product.unit}</p>
               </div>
               <Plus className="size-6 text-primary group-hover:scale-125 transition-transform" />
             </button>
            ))}
          </div>
        )}
      </div>

      {/* Shopping Bag Section */}
      {selectedItems.length > 0 && (
        <div className="mb-12 space-y-8 max-w-2xl mx-auto">
          <div className="flex items-center justify-between px-4">
              <h3 className="text-xs font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-1.5 rounded-full border-2 border-primary/20">Shopping Bag</h3>
              <button onClick={() => setSelectedItems([])} className="text-xs font-black text-secondary uppercase hover:scale-110 transition-all">Clear All</button>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {selectedItems.map((product) => (
               <div key={product.id} className="flex items-center justify-between p-6 bg-white rounded-3xl border-4 border-primary/10 hover:border-primary transition-all shadow-sm">
                  <div>
                    <p className="font-black text-primary text-xl leading-tight uppercase tracking-tighter">{product.name}</p>
                    <p className="text-xs font-black text-primary/40 uppercase tracking-widest">{product.unit}</p>
                  </div>
                  <button onClick={() => removeItem(product.id)} className="text-primary/20 hover:text-secondary transition-colors">
                    <X className="size-8" />
                  </button>
               </div>
            ))}
          </div>

          {/* Total Bar - Bold & Floating */}
          <div className="flex items-center justify-between p-8 bg-primary rounded-[2.5rem] border-4 border-primary shadow-[10px_10px_0px_0px_rgba(93,130,193,0.3)]">
            <span className="text-sm font-black text-white uppercase tracking-[0.3em]">Estimated Total</span>
            <span className="text-4xl font-black text-white italic tracking-tighter">${totalCost.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Action Button - No Stars */}
      <div className="max-w-2xl mx-auto">
        <Button
          onClick={findCheapest}
          disabled={selectedItems.length === 0 || isLoading}
          className="w-full h-20 text-2xl font-black bg-secondary border-4 border-primary text-foreground rounded-full shadow-[10px_10px_0px_0px_#5D82C1] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all active:scale-[0.95] uppercase tracking-tighter"
        >
          {isLoading ? (
            <Loader2 className="size-8 animate-spin" />
          ) : (
            "Create"
          )}
        </Button>
      </div>
    </div>
  );
}