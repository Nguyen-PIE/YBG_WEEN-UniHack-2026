import React, { useState } from 'react';
import {
  Search,
  Clock,
  Users,
  ChefHat,
  Loader2,
  ShoppingCart,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { generateRecipe, RecipeResult } from '../utils/api';
import { toast } from 'sonner';
import { RecipeMarkdown } from '../components/RecipeMarkdown';

const MEAL_TYPES = ['Any', 'Breakfast', 'Lunch', 'Dinner'];
const DURATIONS = ['Any', '15min', '30min', '1hr+'];

export function Recipes() {
  const [query, setQuery] = useState('');
  const [budget, setBudget] = useState(20);
  const [servings, setServings] = useState(2);
  const [mealType, setMealType] = useState('Any');
  const [duration, setDuration] = useState('Any');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<RecipeResult | null>(null);

  const handleGenerate = async () => {
    if (!query.trim()) {
      toast.error('Tell us what you want to cook!');
      return;
    }
    setLoading(true);
    setRecipe(null);
    try {
      const result = await generateRecipe(
        budget,
        servings,
        500,
        query.trim(),
        mealType === 'Any' ? undefined : mealType,
        duration === 'Any' ? undefined : duration,
      );
      setRecipe(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Couldn't generate recipe: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="py-16 text-center">
        <h1 className="text-6xl md:text-8xl font-black text-primary italic uppercase tracking-tighter leading-none">
          Recipe Generator
        </h1>
        <p className="text-primary/60 font-black uppercase text-[10px] tracking-[0.4em] mt-6">
          AI-powered recipes from real supermarket prices
        </p>
      </div>

      {/* Controls */}
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Search input */}
        <div className="relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-accent p-2 rounded-xl border-4 border-primary shadow-[2px_2px_0px_0px_black] z-10">
            <Search className="size-6 text-primary" />
          </div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="What do you feel like? e.g. pasta, chicken stir fry..."
            className="h-24 pl-24 pr-6 text-2xl border-4 border-primary bg-white rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(93,130,193,0.2)] font-black italic placeholder:text-primary/10"
          />
        </div>

        {/* Budget & Servings sliders */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white border-4 border-primary rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(93,130,193,0.15)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="size-5 text-primary" />
                <span className="font-black text-primary uppercase text-xs tracking-widest">Budget</span>
              </div>
              <span className="text-4xl font-black text-primary italic tracking-tighter">
                ${budget}
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-[var(--color-primary)]"
            />
            <div className="flex justify-between text-[10px] font-black text-primary/30 uppercase tracking-widest mt-1">
              <span>$5</span>
              <span>$100</span>
            </div>
          </div>

          <div className="bg-white border-4 border-primary rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(93,130,193,0.15)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                <span className="font-black text-primary uppercase text-xs tracking-widest">Servings</span>
              </div>
              <span className="text-4xl font-black text-primary italic tracking-tighter">
                {servings}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={8}
              step={1}
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              className="w-full accent-[var(--color-primary)]"
            />
            <div className="flex justify-between text-[10px] font-black text-primary/30 uppercase tracking-widest mt-1">
              <span>1</span>
              <span>8</span>
            </div>
          </div>
        </div>

        {/* Meal Type */}
        <div className="space-y-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">Meal Type:</span>
          <div className="flex flex-wrap gap-3">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={`px-6 py-2 rounded-full border-4 border-primary font-black uppercase text-xs tracking-widest transition-all ${
                  mealType === type
                    ? 'bg-primary text-white shadow-[4px_4px_0px_0px_rgba(93,130,193,0.4)]'
                    : 'bg-white text-primary/40 border-primary/20 hover:border-primary'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">Cook Time:</span>
          <div className="flex flex-wrap gap-3">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`px-6 py-2 rounded-full border-4 border-primary font-black uppercase text-xs tracking-widest transition-all ${
                  duration === d
                    ? 'bg-secondary text-primary shadow-[4px_4px_0px_0px_#5D82C1]'
                    : 'bg-white text-primary/40 border-primary/20 hover:border-primary'
                }`}
              >
                {d === 'Any' ? 'Any' : <span className="flex items-center gap-1"><Clock className="size-3" />{d}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={loading || !query.trim()}
          className="w-full h-20 text-2xl font-black bg-secondary border-4 border-primary text-foreground rounded-full shadow-[10px_10px_0px_0px_#5D82C1] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all active:scale-[0.95] uppercase tracking-tighter"
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <Loader2 className="size-8 animate-spin" />
              Cooking up your recipe...
            </span>
          ) : (
            <span className="flex items-center gap-3">
              <Sparkles className="size-6" />
              Generate Recipe
            </span>
          )}
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white border-4 border-primary rounded-[2rem] p-12 text-center animate-pulse shadow-[12px_12px_0px_0px_rgba(93,130,193,0.1)]">
            <ChefHat className="size-16 text-primary/20 mx-auto mb-4" />
            <p className="text-xl font-black text-primary/40 uppercase tracking-widest">
              Finding the best prices & crafting your recipe...
            </p>
          </div>
        </div>
      )}

      {/* Generated Recipe */}
      {recipe && !loading && (
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white border-4 border-primary rounded-[2rem] shadow-[12px_12px_0px_0px_#5D82C1] overflow-hidden">
            {/* Recipe header */}
            <div className="bg-primary/5 border-b-4 border-primary/20 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChefHat className="size-6 text-primary" />
                <span className="font-black text-primary uppercase tracking-widest text-sm">
                  AI-Generated Recipe
                </span>
              </div>
              <div className="flex items-center gap-2 font-black text-primary italic text-2xl tracking-tighter">
                <DollarSign className="size-5" />
                {recipe.totalPrice.toFixed(2)}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-0">
              {/* Markdown column */}
              <div className="p-8 border-r-0 lg:border-r-4 border-primary/10">
                <RecipeMarkdown markdown={recipe.recipeMarkdown} />
              </div>

              {/* Ingredients column */}
              <div className="p-8">
                <div className="flex items-center gap-2 mb-6">
                  <ShoppingCart className="size-5 text-primary" />
                  <span className="font-black text-primary uppercase text-xs tracking-widest">
                    Shopping List
                    <span className="ml-2 bg-accent px-2 py-0.5 rounded-full border border-primary/20 text-[10px]">
                      {recipe.ingredients.length} ITEMS
                    </span>
                  </span>
                </div>

                <div className="space-y-2">
                  {recipe.ingredients.map((ing) => (
                    <div
                      key={ing.id}
                      className="flex items-center justify-between p-3 bg-background border-2 border-primary/20 rounded-xl hover:border-primary transition-all"
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
                    ${recipe.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!recipe && !loading && (
        <div className="max-w-2xl mx-auto px-4 text-center py-20">
          <div className="border-4 border-dashed border-primary/10 rounded-[3rem] p-16">
            <ChefHat className="size-16 text-primary/10 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-primary/20 uppercase italic tracking-tighter mb-3">
              Your recipe will appear here
            </h3>
            <p className="text-xs font-black text-primary/20 uppercase tracking-widest">
              Enter a dish or ingredient above and hit Generate
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
