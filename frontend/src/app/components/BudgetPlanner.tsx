import { useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { DollarSign, Users, Utensils, Loader2, Clock, ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import { generateRecipe, RecipeResult } from '../utils/api';

interface BudgetPlannerProps {
  onGenerateRecipe: (recipe: RecipeResult) => void;
}

const MEAL_TYPE_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
];

const DURATION_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: '5', label: '5 min' },
  { value: '10', label: '10 min' },
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '1hr+', label: '1hr+' },
];

export function BudgetPlanner({ onGenerateRecipe }: BudgetPlannerProps) {
  const [budget, setBudget] = useState(20);
  const [people, setPeople] = useState(2);
  const [mealType, setMealType] = useState('any');
  const [duration, setDuration] = useState('any');
  const [isLoading, setIsLoading] = useState(false);

  const generateGroceryList = async () => {
    setIsLoading(true);
    const loadingToast = toast.loading("Bunny is cooking up your recipe...");

    try {
      const recipe = await generateRecipe(
        budget,
        people,
        500,
        undefined,
        mealType === 'any' ? undefined : mealType,
        duration === 'any' ? undefined : duration,
      );
      onGenerateRecipe(recipe);
      toast.success("Recipe generated!", { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "The bunny tripped! Check your connection.",
        { id: loadingToast }
      );
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
        {/* Budget Slider */}
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

        {/* People Slider */}
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

        {/* Meal Type Selector */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 font-black text-primary uppercase text-xs tracking-widest px-2">
            <div className="bg-muted p-1.5 rounded-lg border-2 border-primary shadow-[2px_2px_0px_0px_rgba(93,130,193,1)]">
              <Utensils className="size-4 text-primary" />
            </div>
            Meal Type
          </Label>
          <div className="flex gap-2 flex-wrap px-2">
            {MEAL_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMealType(opt.value)}
                className={`
                  px-5 py-2.5 rounded-full border-2 font-black text-xs uppercase tracking-wider transition-all
                  ${mealType === opt.value
                    ? 'bg-primary text-white border-primary shadow-[3px_3px_0px_0px_rgba(93,130,193,0.5)]'
                    : 'bg-background text-primary border-primary/30 hover:border-primary hover:shadow-[2px_2px_0px_0px_rgba(93,130,193,0.3)]'
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration Selector */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 font-black text-primary uppercase text-xs tracking-widest px-2">
            <div className="bg-accent p-1.5 rounded-lg border-2 border-primary shadow-[2px_2px_0px_0px_rgba(93,130,193,1)]">
              <Clock className="size-4 text-primary" />
            </div>
            Duration
          </Label>
          <div className="flex gap-2 flex-wrap px-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDuration(opt.value)}
                className={`
                  px-5 py-2.5 rounded-full border-2 font-black text-xs uppercase tracking-wider transition-all
                  ${duration === opt.value
                    ? 'bg-primary text-white border-primary shadow-[3px_3px_0px_0px_rgba(93,130,193,0.5)]'
                    : 'bg-background text-primary border-primary/30 hover:border-primary hover:shadow-[2px_2px_0px_0px_rgba(93,130,193,0.3)]'
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active settings summary */}
        {(mealType !== 'any' || duration !== 'any') && (
          <div className="px-2 flex gap-2 flex-wrap">
            {mealType !== 'any' && (
              <span className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                <ChefHat className="size-3" />
                {MEAL_TYPE_OPTIONS.find(o => o.value === mealType)?.label}
              </span>
            )}
            {duration !== 'any' && (
              <span className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                <Clock className="size-3" />
                {DURATION_OPTIONS.find(o => o.value === duration)?.label}
              </span>
            )}
          </div>
        )}
      </div>

      <Button
        onClick={generateGroceryList}
        disabled={isLoading}
        className="w-full mt-16 h-20 text-2xl font-black bg-secondary border-4 border-primary text-foreground rounded-full shadow-[10px_10px_0px_0px_#5D82C1] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all active:scale-[0.95] uppercase tracking-widest"
      >
        {isLoading ? (
          <Loader2 className="size-8 animate-spin" />
        ) : (
          "Let\'s Hop!"
        )}
      </Button>
    </div>
  );
}
