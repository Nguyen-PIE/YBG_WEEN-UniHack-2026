import { useState, useEffect } from 'react';
import { getSavedLists, deleteList } from '../utils/storage';
import { ShoppingList, products } from '../data/mockData';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ListChecks, Trash2, Calendar, DollarSign } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { toast } from 'sonner';

export function SavedLists() {
  const [savedLists, setSavedLists] = useState<ShoppingList[]>([]);
  const [expandedList, setExpandedList] = useState<string | null>(null);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = () => {
    const lists = getSavedLists();
    setSavedLists(lists);
  };

  const handleDelete = (id: string, name: string) => {
    deleteList(id);
    loadLists();
    toast.success(`Deleted "${name}"`);
  };

  const calculateListTotal = (list: ShoppingList) => {
    return list.items.reduce((total, itemId) => {
      const product = products.find((p) => p.id === itemId);
      if (!product) return total;
      const cheapestPrice = Math.min(
        ...product.prices.map((p) => p.salePrice || p.price)
      );
      return total + cheapestPrice;
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-400 to-pink-400 text-white p-10 relative overflow-hidden rounded-3xl border-none shadow-2xl">
        <img 
          src={"assets/bunny.png"}
          alt="Budget Bunny"
          className="absolute right-4 top-4 size-36 opacity-40"
        />
        <div className="flex items-center gap-3 mb-3">
          <ListChecks className="size-10" />
          <h1 className="text-4xl font-black drop-shadow-lg">Your Lists 📋</h1>
        </div>
        <p className="text-xl opacity-95 font-medium">
          All your saved shopping lists in one place! 💜
        </p>
      </Card>

      {/* Saved Lists */}
      {savedLists.length > 0 ? (
        <div className="grid gap-5">
          {savedLists
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map((list) => {
              const total = calculateListTotal(list);
              const isExpanded = expandedList === list.id;

              return (
                <Card key={list.id} className="p-6 bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 rounded-3xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-black mb-3 text-gray-800">{list.name}</h3>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="flex items-center gap-1 bg-purple-100 px-3 py-1 rounded-full text-purple-800 font-medium">
                          <Calendar className="size-4" />
                          {list.createdAt.toLocaleDateString()}
                        </span>
                        <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-none rounded-full px-3 py-1">
                          {list.items.length} items
                        </Badge>
                        <span className="flex items-center gap-1 font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                          <DollarSign className="size-4" />
                          {total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedList(isExpanded ? null : list.id)}
                        className="rounded-xl border-2 border-purple-300 hover:bg-purple-50"
                      >
                        {isExpanded ? '👆 Hide' : '👀 View'}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 rounded-xl border-2 border-red-300">
                            <Trash2 className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this list?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{list.name}"? This can't be undone!
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Nope, keep it</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(list.id, list.name)}
                              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl"
                            >
                              Yes, delete it
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="pt-4 border-t-2 border-dashed border-purple-200">
                      <h4 className="font-bold mb-4 text-gray-700 text-lg">📦 What's in here:</h4>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {list.items.map((itemId) => {
                          const product = products.find((p) => p.id === itemId);
                          if (!product) return null;

                          const cheapestPrice = Math.min(
                            ...product.prices.map((p) => p.salePrice || p.price)
                          );
                          const cheapestStore = product.prices.find(
                            (p) => (p.salePrice || p.price) === cheapestPrice
                          );

                          return (
                            <Card key={itemId} className="p-3 bg-white border-2 border-purple-100 rounded-2xl">
                              <h5 className="font-bold text-sm text-gray-800">{product.name}</h5>
                              <p className="text-xs text-gray-600 mb-2">{product.unit}</p>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                                  {cheapestStore?.storeName}
                                </span>
                                <span className="font-bold text-green-600 text-lg">
                                  ${cheapestPrice.toFixed(2)}
                                </span>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
        </div>
      ) : (
        <Card className="p-16 text-center bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-dashed border-purple-300 rounded-3xl">
          <div className="text-7xl mb-4">📭</div>
          <h3 className="text-2xl font-black text-gray-800 mb-3">Nothing saved yet!</h3>
          <p className="text-gray-700 mb-8 text-lg">
            Make a list and save it so you can use it later! 🐰
          </p>
          <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl px-8 py-6 text-lg shadow-lg">
            <a href="/">Let's Go Shopping!</a>
          </Button>
        </Card>
      )}
    </div>
  );
}