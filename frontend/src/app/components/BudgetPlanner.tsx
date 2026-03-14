import { useState } from 'react';
import { products, ProductWithPrices } from '../data/mockData';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { DollarSign, Users, Utensils, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface BudgetPlannerProps {
  onGenerateList: (items: ProductWithPrices[]) => void;
}

export function BudgetPlanner({ onGenerateList }: BudgetPlannerProps) {
  const [budget, setBudget] = useState('');
  const [people, setPeople] = useState('');
  const [meals, setMeals] = useState('');

  const generateGroceryList = () => {
    const budgetNum = parseFloat(budget);
    const peopleNum = parseInt(people);
    const mealsNum = parseInt(meals);

    if (!budgetNum || budgetNum <= 0) {
      toast.error('Please enter a valid budget');
      return;
    }

    if (!peopleNum || peopleNum <= 0) {
      toast.error('Please enter number of people');
      return;
    }

    if (!mealsNum || mealsNum <= 0) {
      toast.error('Please enter number of meals');
      return;
    }

    const essentialCategories = ['Grains', 'Proteins', 'Vegetables'];
    const budgetPerCategory = budgetNum / 3;

    const selectedProducts: ProductWithPrices[] = [];
    let totalCost = 0;
    let totalCalories = 0;

    essentialCategories.forEach((category) => {
      const categoryProducts = products.filter((p) => p.category === category);
      let categorySpent = 0;

      categoryProducts.forEach((product) => {
        const cheapestPrice = Math.min(
          ...product.prices.map((p) => p.salePrice || p.price)
        );

        if (
          categorySpent + cheapestPrice <= budgetPerCategory &&
          totalCost + cheapestPrice <= budgetNum
        ) {
          selectedProducts.push(product);
          totalCost += cheapestPrice;
          categorySpent += cheapestPrice;
          totalCalories += product.calories || 0;
        }
      });
    });

    const remainingProducts = products.filter(
      (p) => !selectedProducts.includes(p)
    );
    
    remainingProducts.forEach((product) => {
      const cheapestPrice = Math.min(
        ...product.prices.map((p) => p.salePrice || p.price)
      );
      
      if (totalCost + cheapestPrice <= budgetNum) {
        selectedProducts.push(product);
        totalCost += cheapestPrice;
        totalCalories += product.calories || 0;
      }
    });

    if (selectedProducts.length === 0) {
      toast.error('Budget too low to generate a meaningful list');
      return;
    }

    toast.success(
      `Generated list with ${selectedProducts.length} items (~$${totalCost.toFixed(2)})`
    );
    onGenerateList(selectedProducts);
  };

  return (
    <Card className="p-8 bg-white border-2 border-slate-200 rounded-3xl shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Sparkles className="size-6 text-pink-500 fill-pink-500" />
          Budget Magic
        </h2>
        <p className="text-slate-500 font-medium">
          Input your constraints and let the bunny find your meals.
        </p>
      </div>

      {/* Symmetrical 3-column grid for desktop, stacked for mobile */}
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
            className="h-12 border-2 border-slate-100 bg-slate-50 rounded-xl focus:border-pink-500 focus:ring-0 transition-colors"
          />
        </div>
      </div>

      <Button 
        onClick={generateGroceryList} 
        className="w-full mt-8 h-14 text-lg font-bold bg-pink-600 hover:bg-pink-700 text-white rounded-2xl shadow-md transition-all active:scale-[0.98]"
      >
        Generate My Grocery List
      </Button>
    </Card>
  );
}