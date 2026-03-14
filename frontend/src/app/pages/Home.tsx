import { useState } from 'react';
import { BudgetPlanner } from '../components/BudgetPlanner';
import { ManualListCreator } from '../components/ManualListCreator';
import { ProductWithPrices } from '../data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Save, Heart } from 'lucide-react';
import { saveList, generateId } from '../utils/storage';
import { toast } from 'sonner';
import bunnyIcon from 'figma:asset/3fe3d535f340869e5c4ecbe83e7dd1670ca78e35.png';

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

    toast.success(`Saved "${name}" 💾`);
    setListName('');
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-pink-400 via-purple-400 to-orange-400 text-white p-10 relative overflow-hidden rounded-3xl border-none shadow-2xl">
        <img 
          src={bunnyIcon}
          alt="Budget Bunny"
          className="absolute -right-4 -top-4 size-40 opacity-40 animate-bounce"
          style={{ animationDuration: '3s' }}
        />
        <h1 className="text-4xl font-black mb-3 drop-shadow-lg">
          Make Every Dollar Count! 💰
        </h1>
        <p className="text-xl opacity-95 font-medium">
          Your friendly bunny buddy helping you find the best grocery deals 🥕✨
        </p>
      </Card>

      {/* Main Search Tabs */}
      <Tabs defaultValue="budget" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 h-14 bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl border-2 border-pink-300">
          <TabsTrigger value="budget" className="rounded-xl text-base font-semibold data-[state=active]:bg-white data-[state=active]:shadow-lg">
            💸 Budget Planner
          </TabsTrigger>
          <TabsTrigger value="manual" className="rounded-xl text-base font-semibold data-[state=active]:bg-white data-[state=active]:shadow-lg">
            📝 Create List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budget">
          <BudgetPlanner onGenerateList={handleGenerateList} />
        </TabsContent>

        <TabsContent value="manual">
          <ManualListCreator onCreateList={handleGenerateList} />
        </TabsContent>
      </Tabs>

      {/* Generated List Display */}
      {generatedList.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-3xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              🛒 Your Shopping List ({generatedList.length} items)
            </h3>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Give it a name..."
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                className="w-48 rounded-xl border-2 border-green-300"
              />
              <Button onClick={handleSaveList} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl shadow-md">
                <Heart className="size-4 mr-2" />
                Save It!
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {generatedList.map((product) => {
              const cheapestPrice = Math.min(
                ...product.prices.map((p) => p.salePrice || p.price)
              );
              const cheapestStore = product.prices.find(
                (p) => (p.salePrice || p.price) === cheapestPrice
              );

              return (
                <Card key={product.id} className="p-4 bg-white border-2 border-green-200 rounded-2xl hover:shadow-lg transition-shadow">
                  <h4 className="font-bold text-gray-800">{product.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{product.unit}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                      {cheapestStore?.storeName}
                    </span>
                    <span className="font-bold text-xl text-green-600">
                      ${cheapestPrice.toFixed(2)}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        <Card className="p-6 border-none bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-4xl mb-3">🏪</div>
          <h3 className="font-bold text-green-900 mb-2 text-lg">Community Love</h3>
          <p className="text-sm text-green-800">
            Find local food pantries with free or cheap essentials when you need 'em most!
          </p>
        </Card>
        
        <Card className="p-6 border-none bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-4xl mb-3">💸</div>
          <h3 className="font-bold text-blue-900 mb-2 text-lg">Real Prices</h3>
          <p className="text-sm text-blue-800">
            We check prices at all the big stores so you don't have to!
          </p>
        </Card>
        
        <Card className="p-6 border-none bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-4xl mb-3">🧠</div>
          <h3 className="font-bold text-purple-900 mb-2 text-lg">Smart Bunny</h3>
          <p className="text-sm text-purple-800">
            Get lists that match your budget AND keep you fed with good nutrition!
          </p>
        </Card>
      </div>
    </div>
  );
}