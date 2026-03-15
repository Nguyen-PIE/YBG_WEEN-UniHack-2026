import { useState } from 'react';
import { ProductWithPrices } from '../data/mockData';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { DollarSign, Users, Utensils, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BudgetPlannerProps {
  onGenerateList: (items: ProductWithPrices[]) => void;
}

export function BudgetPlanner({ onGenerateList }: BudgetPlannerProps) {
  const [budget, setBudget] = useState(20);
  const [people, setPeople] = useState(2);
  const [meals, setMeals] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const generateGroceryList = async () => {
    setIsLoading(true);
    const loadingToast = toast.loading("Bunny is crunching the numbers...");

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/generate-recipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget: budget,
          servings: people,
          target_calories: Math.round(2000 / meals) 
        })
      });

      if (!response.ok) throw new Error("Backend failed");
      const data = await response.json();
      onGenerateList(data.ingredientsToBuy);
      toast.success(`Generated list via Python Backend!`, { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error("The bunny tripped! Check your connection.", { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 bg-transparent">
      <div className="mb-12 text-center">
        <h2 className="text-5xl font-black text-primary font-display italic tracking-tighter uppercase">
        </h2>
        <p className="text-primary/60 font-black uppercase text-[10px] tracking-[0.3em] mt-3">
          Let our bunny curate your meals
        </p>
      </div>

      <div className="space-y-16 max-w-2xl mx-auto">
        <div className="space-y-6">
          <div className="flex justify-between items-end px-2">
            <Label className="flex items-center gap-2 font-black text-primary uppercase text-xs tracking-widest">
              <div className="bg-accent p-1.5 rounded-lg border-2 border-primary shadow-[2px_2px_0px_0px_rgba(93,130,193,1)]">
                <DollarSign className="size-4 text-primary" />
              </div>
              Budget
            </Label>
            <span className="text-4xl font-black text-primary italic tracking-tighter">
              ${budget}
            </span>
          </div>
          <Slider
            value={[budget]}
            onValueChange={(val) => setBudget(val[0])}
            max={200}
            step={5}
            className="cursor-pointer"
          />
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-end px-2">
            <Label className="flex items-center gap-2 font-black text-primary uppercase text-xs tracking-widest">
              <div className="bg-secondary p-1.5 rounded-lg border-2 border-primary shadow-[2px_2px_0px_0px_rgba(93,130,193,1)]">
                <Users className="size-4 text-primary" />
              </div>
              People
            </Label>
            <span className="text-4xl font-black text-primary italic tracking-tighter">
              {people} <span className="text-sm not-italic ml-1">BUNNIES</span>
            </span>
          </div>
          <Slider
            value={[people]}
            onValueChange={(val) => setPeople(val[0])}
            max={10}
            step={1}
            className="cursor-pointer"
          />
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-end px-2">
            <Label className="flex items-center gap-2 font-black text-primary uppercase text-xs tracking-widest">
              <div className="bg-muted p-1.5 rounded-lg border-2 border-primary shadow-[2px_2px_0px_0px_rgba(93,130,193,1)]">
                <Utensils className="size-4 text-primary" />
              </div>
              Meals
            </Label>
            <span className="text-4xl font-black text-primary italic tracking-tighter">
              {meals} <span className="text-sm not-italic ml-1">PER DAY</span>
            </span>
          </div>
          <Slider
            value={[meals]}
            onValueChange={(val) => setMeals(val[0])}
            max={6}
            step={1}
            className="cursor-pointer"
          />
        </div>
      </div>

      <Button 
        onClick={generateGroceryList} 
        disabled={isLoading}
        className="w-full mt-16 h-20 text-2xl font-black bg-secondary border-4 border-primary text-foreground rounded-full shadow-[10px_10px_0px_0px_#5D82C1] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all active:scale-[0.95] uppercase tracking-widest"
      >
        {isLoading ? (
          <Loader2 className="size-8 animate-spin" />
        ) : (
          "Lets Hop!"
        )}
      </Button>
    </div>
  );
}