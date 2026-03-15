import React, { useState } from 'react';
import { BudgetPlanner } from '../components/BudgetPlanner';
import { ManualListCreator } from '../components/ManualListCreator';
import { ProductWithPrices } from '../utils/api';
import { RecipeResult } from '../utils/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Heart, Sparkles, ChefHat, ShoppingCart, DollarSign, ExternalLink } from 'lucide-react';
import { saveList, saveRecipe, generateId } from '../utils/storage';
import { toast } from 'sonner';
import { RecipeMarkdown } from '../components/RecipeMarkdown';

import LogoLoop from '../components/LogoLoop';
const storeLogos = [
  {
    node: <img src="https://storage.googleapis.com/budget-bunny-assets/Woolworths_Ltd._logo_(2022).svg" alt="Woolworths" className="h-12 w-28 object-contain" />,
    title: 'Woolies',
    href: '#',
  },
  {
    node: <img src="https://storage.googleapis.com/budget-bunny-assets/aldi_logo.png" alt="Aldi" className="h-12 w-28 object-contain" />,
    title: 'Aldi',
    href: '#',
  },
  {
    node: <img src="https://storage.googleapis.com/budget-bunny-assets/coles_logo.jpg" alt="Coles" className="h-12 w-28 object-contain" />,
    title: 'Coles',
    href: '#',
  },
  {
    node: <img src="https://storage.googleapis.com/budget-bunny-assets/IGA_logo.svg" alt="IGA" className="h-12 w-28 object-contain" />,
    title: 'IGA',
    href: '#',
  },
];

export function Home() {
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeResult | null>(null);
  const [generatedList, setGeneratedList] = useState<ProductWithPrices[]>([]);
  const [recipeName, setRecipeName] = useState('');
  const [listName, setListName] = useState('');

  const handleGenerateRecipe = (recipe: RecipeResult) => {
    setGeneratedRecipe(recipe);
  };

  const handleGenerateList = (items: ProductWithPrices[]) => {
    setGeneratedList(items);
  };

  const handleSaveRecipeList = () => {
    if (!generatedRecipe || generatedRecipe.ingredients.length === 0) {
      toast.error('No ingredients to save');
      return;
    }
    const name = recipeName.trim() || `Recipe ${new Date().toLocaleDateString()}`;
    saveRecipe({
      id: generateId(),
      name,
      recipeMarkdown: generatedRecipe.recipeMarkdown,
      ingredients: generatedRecipe.ingredients,
      totalPrice: generatedRecipe.totalPrice,
      createdAt: new Date(),
    });
    toast.success(`Saved "${name}"`);
    setRecipeName('');
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
      items: generatedList.map((p) => {
        const cheapestPrice = Math.min(...p.prices.map((pr) => pr.salePrice ?? pr.price));
        const bestStore = p.prices.find((pr) => (pr.salePrice ?? pr.price) === cheapestPrice);
        return {
          id: p.id,
          name: p.name,
          unit: p.unit,
          price: cheapestPrice,
          store: bestStore?.storeName ?? 'Unknown',
        };
      }),
      createdAt: new Date(),
    });
    toast.success(`Saved "${name}"`);
    setListName('');
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Hero Section */}
      <div className="text-primary py-12 px-4 text-center">
        <div className="relative z-10">
          <h1 className="text-5xl font-black mb-4 italic tracking-tighter uppercase">
            Make Every <span className="text-primary">Dollar</span> Count
          </h1>
          <p className="text-lg font-black uppercase tracking-[0.2em] opacity-80 mb-8">
            Your friendly Bunny Buddy helping you find the best grocery deals!
          </p>

          <div className="max-w-xl mx-auto h-[60px] relative overflow-hidden">
            <LogoLoop
              logos={storeLogos}
              speed={100}
              direction="left"
              logoHeight={32}
              gap={48}
              hoverSpeed={0}
              scaleOnHover
              fadeOut
              fadeOutColor="#f8fafc"
              ariaLabel="Supermarket partners"
            />
          </div>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/30 rounded-full blur-3xl" />
      </div>

      {/* Main Tabs */}
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
          <BudgetPlanner onGenerateRecipe={handleGenerateRecipe} />
        </TabsContent>

        <TabsContent value="manual">
          <ManualListCreator onCreateList={handleGenerateList} />
        </TabsContent>
      </Tabs>

      {/* Generated Recipe Display */}
      {generatedRecipe && (
        <Card className="p-8 bg-white border-4 border-primary rounded-[2rem] shadow-[12px_12px_0px_0px_#5D82C1]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <h3 className="text-3xl font-black text-primary flex items-center gap-2 italic">
              <ChefHat className="size-8" />
              Your Recipe
            </h3>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Input
                type="text"
                placeholder="Name this recipe..."
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                className="rounded-full border-4 border-primary font-bold h-12 bg-cream"
              />
              <Button
                onClick={handleSaveRecipeList}
                className="bg-secondary border-4 border-primary text-foreground rounded-full h-12 px-6 font-black shadow-[4px_4px_0px_0px_#5D82C1] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:scale-95 whitespace-nowrap"
              >
                <Heart className="size-5 mr-2 fill-current" />
                SAVE IT!
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recipe Markdown */}
            <div className="bg-primary/5 rounded-2xl border-2 border-primary/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <ChefHat className="size-5 text-primary" />
                <span className="font-black text-primary uppercase text-xs tracking-widest">Recipe</span>
              </div>
              <div className="prose prose-sm max-w-none">
                <RecipeMarkdown markdown={generatedRecipe.recipeMarkdown} />
              </div>
            </div>

            {/* Ingredient Shopping List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="size-5 text-primary" />
                  <span className="font-black text-primary uppercase text-xs tracking-widest">
                    Shopping List
                    <span className="ml-2 text-[10px] bg-accent px-2 py-0.5 rounded-full border border-primary/20">
                      {generatedRecipe.ingredients.length} ITEMS
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-primary font-black">
                  <DollarSign className="size-4" />
                  <span className="text-2xl italic tracking-tighter">
                    {generatedRecipe.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {generatedRecipe.ingredients.map((ing) => (
                  <div
                    key={ing.id}
                    className="flex items-center justify-between p-3 bg-background border-2 border-primary/20 rounded-xl hover:border-primary transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-6 min-w-6 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs flex items-center justify-center font-black">
                        {ing.qty}
                      </span>
                      <div>
                        <p className="font-black text-sm text-foreground uppercase tracking-tight leading-tight">
                          {ing.name}
                        </p>
                        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                          {ing.store}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary">${ing.totalPrice.toFixed(2)}</p>
                      <p className="text-[10px] text-foreground/40 font-bold">
                        ${ing.unitPrice.toFixed(2)} ea
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between p-4 bg-primary/10 border-2 border-primary rounded-xl mt-4">
                <span className="font-black text-primary uppercase text-sm tracking-widest">Total</span>
                <span className="font-black text-primary text-2xl italic tracking-tighter">
                  ${generatedRecipe.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Manual List Display */}
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
                ...product.prices.map((p) => p.salePrice ?? p.price)
              );
              const bestStore = product.prices.find(
                (p) => (p.salePrice ?? p.price) === cheapestPrice
              );

              const CardContent = (
                <Card
                  key={product.id}
                  className="p-5 bg-background border-4 border-primary/20 rounded-2xl hover:border-primary hover:shadow-[4px_4px_0px_0px_#5D82C1] transition-all group h-full"
                >
                  {/* Product image */}
                  {bestStore?.image && (
                    <div className="aspect-video bg-primary/5 rounded-xl border-2 border-primary/10 mb-4 overflow-hidden flex items-center justify-center p-3">
                      <img
                        src={bestStore.image}
                        alt={product.name}
                        className="object-contain max-h-full mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-black text-foreground text-lg leading-tight uppercase tracking-tighter">
                      {product.name}
                    </h4>
                    {bestStore?.url ? (
                      <ExternalLink className="size-4 text-primary/30 group-hover:text-primary transition-colors flex-shrink-0" />
                    ) : (
                      <Sparkles className="size-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-4">
                    {product.unit}
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/30">
                      {bestStore?.storeName ?? 'Unknown'}
                    </span>
                    <span className="font-black text-2xl text-primary tracking-tighter">
                      ${cheapestPrice.toFixed(2)}
                    </span>
                  </div>
                </Card>
              );

              return bestStore?.url ? (
                <a
                  key={product.id}
                  href={bestStore.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {CardContent}
                </a>
              ) : (
                <div key={product.id}>{CardContent}</div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
