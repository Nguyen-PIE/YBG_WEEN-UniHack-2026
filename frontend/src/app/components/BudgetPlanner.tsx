import { useState } from 'react';
import { ProductWithPrices } from '../data/mockData';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { DollarSign, Users, Utensils, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BudgetPlannerProps {
  onGenerateList: (items: ProductWithPrices[]) => void;
}

export function BudgetPlanner({ onGenerateList }: BudgetPlannerProps) {
  const [budget, setBudget] = useState('');
  const [people, setPeople] = useState('');
  const [meals, setMeals] = useState('');
  const [isLoading, setIsLoading] = useState(false);

const generateGroceryList = async () => {
    const budgetNum = parseFloat(budget);
    const peopleNum = parseInt(people);
    const mealsNum = parseInt(meals);

    // Validation
    if (!budgetNum || budgetNum <= 0) return toast.error('Please enter a valid budget');
    if (!peopleNum || peopleNum <= 0) return toast.error('How many people are we feeding?');
    if (!mealsNum || mealsNum <= 0) return toast.error('How many meals do you need?');

    setIsLoading(true);
    const loadingToast = toast.loading("Bunny is crunching the numbers...");

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

      const response = await fetch(`${API_URL}/generate-recipe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          budget: budgetNum,
          servings: peopleNum,
          target_calories: Math.round(2000 / mealsNum) 
        })
      });

      if (!response.ok) throw new Error("Backend failed to generate list");

      const data = await response.json();
      
      // Map to the correct key returned by your Python OpenAI prompt
      onGenerateList(data.ingredientsToBuy);
      
      toast.success(`Generated list via Python Backend!`, { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error("The bunny tripped! Make sure your Python server is running.", { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 font-display">
          <Sparkles className="size-6 text-pink-500 fill-pink-500" />
          Budget Magic
        </h2>
        <p className="text-slate-500 font-medium">
          Input your constraints and let the bunny find your meals.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="budget" className="flex items-center gap-2 font-bold text-slate-700">
            <DollarSign className="size-4 text-emerald-600" />
            Budget
          </Label>
          <Input
            id="budget"
            type="number"
            placeholder="0.00"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            disabled={isLoading}
            className="h-12 border-2 border-slate-100 bg-slate-50 rounded-xl focus:border-pink-500 focus:ring-0 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="people" className="flex items-center gap-2 font-bold text-slate-700">
            <Users className="size-4 text-blue-600" />
            People
          </Label>
          <Input
            id="people"
            type="number"
            placeholder="1"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            disabled={isLoading}
            className="h-12 border-2 border-slate-100 bg-slate-50 rounded-xl focus:border-pink-500 focus:ring-0 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meals" className="flex items-center gap-2 font-bold text-slate-700">
            <Utensils className="size-4 text-orange-600" />
            Meals
          </Label>
          <Input
            id="meals"
            type="number"
            placeholder="1"
            value={meals}
            onChange={(e) => setMeals(e.target.value)}
            disabled={isLoading}
            className="h-12 border-2 border-slate-100 bg-slate-50 rounded-xl focus:border-pink-500 focus:ring-0 transition-colors"
          />
        </div>
      </div>

      <Button 
        onClick={generateGroceryList} 
        disabled={isLoading}
        className="w-full mt-8 h-14 text-lg font-bold bg-pink-600 hover:bg-pink-700 text-white rounded-2xl shadow-md transition-all active:scale-[0.98]"
      >
        {isLoading ? (
          <Loader2 className="size-5 animate-spin mr-2" />
        ) : null}
        {isLoading ? "Crunching Numbers..." : "Generate My Grocery List"}
      </Button>
    </Card>
  );
}