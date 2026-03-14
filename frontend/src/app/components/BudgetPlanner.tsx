import { useState } from 'react';
import { products, ProductWithPrices } from '../data/mockData';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { DollarSign, Users, Utensils } from 'lucide-react';
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

    // Budget allocation strategy: prioritize essentials
    const essentialCategories = ['Grains', 'Proteins', 'Vegetables'];
    const budgetPerCategory = budgetNum / 3;

    const selectedProducts: ProductWithPrices[] = [];
    let totalCost = 0;
    let totalCalories = 0;

    // Select products from each essential category
    essentialCategories.forEach((category) => {
      const categoryProducts = products.filter((p) => p.category === category);
      let categorySpent = 0;

      categoryProducts.forEach((product) => {
        // Find cheapest price for this product
        const cheapestPrice = Math.min(
          ...product.prices.map((p) => p.salePrice || p.price)
        );

        // Add if within category budget and overall budget
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

    // Try to add more items if budget allows
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
      `Generated list with ${selectedProducts.length} items (~$${totalCost.toFixed(2)}, ${totalCalories.toLocaleString()} calories)`
    );
    onGenerateList(selectedProducts);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-dashed border-pink-300 rounded-3xl">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">💸 Budget Magic!</h2>
      <p className="text-sm text-gray-700 mb-6">
        Tell us your budget and we'll create a shopping list that keeps you fed! 🥕
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="budget" className="flex items-center gap-2 mb-2 font-semibold text-gray-700">
            <DollarSign className="size-5 text-green-600" />
            Your Budget
          </Label>
          <Input
            id="budget"
            type="number"
            placeholder="15.00"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            min="0"
            step="0.01"
            className="text-lg py-6 border-2 border-pink-300 rounded-2xl focus:border-purple-400"
          />
        </div>

        <div>
          <Label htmlFor="people" className="flex items-center gap-2 mb-2 font-semibold text-gray-700">
            <Users className="size-5 text-blue-600" />
            People to Feed
          </Label>
          <Input
            id="people"
            type="number"
            placeholder="2"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            min="1"
            className="text-lg py-6 border-2 border-pink-300 rounded-2xl focus:border-purple-400"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="meals" className="flex items-center gap-2 mb-2 font-semibold text-gray-700">
            <Utensils className="size-5 text-orange-600" />
            Number of Meals
          </Label>
          <Input
            id="meals"
            type="number"
            placeholder="7"
            value={meals}
            onChange={(e) => setMeals(e.target.value)}
            min="1"
            className="text-lg py-6 border-2 border-pink-300 rounded-2xl focus:border-purple-400"
          />
        </div>
      </div>

      <Button onClick={generateGroceryList} className="w-full mt-6 py-6 text-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
        Create My Meal!
      </Button>
    </Card>
  );
}