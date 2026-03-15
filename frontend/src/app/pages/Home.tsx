import { useState } from 'react';
import { BudgetPlanner } from '../components/BudgetPlanner';
import { ManualListCreator } from '../components/ManualListCreator';
import { ProductWithPrices } from '../data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Heart, Sparkles } from 'lucide-react';
import { saveList, generateId } from '../utils/storage';
import { toast } from 'sonner';

export function Home() {
  const [generatedList, setGeneratedList] = useState<ProductWithPrices[]>([]);
  const [listName, setListName] = useState('');

  const handleGenerateList = (items: ProductWithPrices[]) => {
    setGeneratedList(items);
  };

  const handleSaveList = () => {
    if (generatedList.length === 0) {
      toast.error('No items to save');
      return;
    }

    const name = listName.trim() || `List ${new Date().toLocaleDateString()}`;
    
    saveList({
      id: generateId(),
      name,
      items: generatedList.map((p) => p.id),
      createdAt: new Date(),
    });

    toast.success(`Saved "${name}"`);
    setListName('');
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Hero Section - NewJeans Denim Look */}
      <div className="text-primary py-12 px-4 text-center">
        <div className="relative z-10">
          <h1 className="text-5xl font-black mb-4 italic tracking-tighter uppercase">
            Make Every <span className="text-primary">Dollar</span> Count
          </h1>
          <p className="text-lg font-black uppercase tracking-[0.2em] opacity-80">
            Your friendly Bunny Buddy helping you find the best grocery deals!
          </p>
        </div>
        {/* Subtle decorative circle for that Y2K look */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/30 rounded-full blur-3xl" />
      </div>

      {/* Main Search Tabs - Stationery Look */}
      <Tabs defaultValue="budget" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 h-16 bg-primary/5 border-4 border-primary rounded-full p-2">
          <TabsTrigger 
            value="budget" 
            className="rounded-full text-lg font-black uppercase tracking-tight data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            Budget Planner
          </TabsTrigger>
          <TabsTrigger 
            value="manual" 
            className="rounded-full text-lg font-black uppercase tracking-tight data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            Create List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budget">
          <BudgetPlanner onGenerateList={handleGenerateList} />
        </TabsContent>

        <TabsContent value="manual">
          <ManualListCreator onCreateList={handleGenerateList} />
        </TabsContent>
      </Tabs>

      {/* Generated List Display - "Scrapbook" Style */}
      {generatedList.length > 0 && (
        <Card className="p-8 bg-white border-4 border-primary rounded-[2rem] shadow-[12px_12px_0px_0px_#5D82C1]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <h3 className="text-3xl font-black text-primary flex items-center gap-2 italic">
              Your Shopping List
              <span className="text-sm not-italic bg-accent px-3 py-1 rounded-full border-2 border-primary text-foreground ml-2">
                {generatedList.length} ITEMS
              </span>
            </h3>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Input
                type="text"
                placeholder="Name your haul..."
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                className="rounded-full border-4 border-primary font-bold h-12 bg-cream"
              />
              <Button 
                onClick={handleSaveList} 
                className="bg-secondary border-4 border-primary text-foreground rounded-full h-12 px-6 font-black shadow-[4px_4px_0px_0px_#5D82C1] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:scale-95"
              >
                <Heart className="size-5 mr-2 fill-current" />
                SAVE IT!
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {generatedList.map((product) => {
              const cheapestPrice = Math.min(
                ...product.prices.map((p) => p.salePrice || p.price)
              );
              const cheapestStore = product.prices.find(
                (p) => (p.salePrice || p.price) === cheapestPrice
              );

              return (
                <Card key={product.id} className="p-5 bg-background border-4 border-primary/20 rounded-2xl hover:border-primary hover:shadow-[4px_4px_0px_0px_#5D82C1] transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-black text-foreground text-lg leading-tight uppercase tracking-tighter">
                      {product.name}
                    </h4>
                    <Sparkles className="size-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-4">{product.unit}</p>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/30">
                      {cheapestStore?.storeName}
                    </span>
                    <span className="font-black text-2xl text-primary tracking-tighter">
                      ${cheapestPrice.toFixed(2)}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}