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
    <Card className="p-8 bg-background border-4 border-primary rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(93,130,193,0.2)]">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-foreground flex items-center gap-2 font-display italic tracking-tight">
          <Sparkles className="size-7 text-secondary fill-secondary" />
          Budget Calculator
        </h2>
        <p className="text-foreground/70 font-bold uppercase text-xs tracking-widest mt-1">
          Input your constraints & let our bunny find your meals
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Budget Input */}
        <div className="space-y-2">
          <Label htmlFor="budget" className="flex items-center gap-2 font-black text-foreground uppercase text-[10px] tracking-tighter">
            <div className="bg-accent p-1 rounded-md border-2 border-primary">
               <DollarSign className="size-3 text-primary" />
            </div>
            Budget
          </Label>
          <Input
            id="budget"
            type="number"
            placeholder="0.00"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            disabled={isLoading}
            className="h-12 border-4 border-primary bg-white rounded-2xl focus:ring-0 focus:bg-accent/20 transition-all font-bold text-lg"
          />
        </div>

        {/* People Input */}
        <div className="space-y-2">
          <Label htmlFor="people" className="flex items-center gap-2 font-black text-foreground uppercase text-[10px] tracking-tighter">
             <div className="bg-secondary p-1 rounded-md border-2 border-primary">
                <Users className="size-3 text-primary" />
             </div>
            People
          </Label>
          <Input
            id="people"
            type="number"
            placeholder="1"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            disabled={isLoading}
            className="h-12 border-4 border-primary bg-white rounded-2xl focus:ring-0 focus:bg-accent/20 transition-all font-bold text-lg"
          />
        </div>

        {/* Meals Input */}
        <div className="space-y-2">
          <Label htmlFor="meals" className="flex items-center gap-2 font-black text-foreground uppercase text-[10px] tracking-tighter">
             <div className="bg-njBlue/20 p-1 rounded-md border-2 border-primary">
                <Utensils className="size-3 text-primary" />
             </div>
            Meals
          </Label>
          <Input
            id="meals"
            type="number"
            placeholder="1"
            value={meals}
            onChange={(e) => setMeals(e.target.value)}
            disabled={isLoading}
            className="h-12 border-4 border-primary bg-white rounded-2xl focus:ring-0 focus:bg-accent/20 transition-all font-bold text-lg"
          />
        </div>
      </div>

      <Button 
        onClick={generateGroceryList} 
        disabled={isLoading}
        className="w-full mt-10 h-16 text-xl font-black bg-secondary border-4 border-primary text-foreground rounded-full shadow-[6px_6px_0px_0px_#5D82C1] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all active:scale-[0.95] uppercase tracking-tighter"
      >
        {isLoading ? (
          <Loader2 className="size-6 animate-spin mr-3" />
        ) : (
          <Sparkles className="size-5 mr-2 fill-current" />
        )}
        {isLoading ? "Crunching..." : "Generate My Grocery List"}
      </Button>
    </Card>
  );
}