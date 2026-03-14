import { useState, useEffect } from 'react';
import { getSavedLists, deleteList } from '../utils/storage';
import { ShoppingList, products } from '../data/mockData';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ListChecks, Trash2, Calendar, DollarSign, Eye, EyeOff } from 'lucide-react';
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
      {/* Header - Flat Style */}
      <Card className="bg-pink-600 text-white p-10 relative overflow-hidden rounded-3xl border-none shadow-md">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <ListChecks className="size-10" />
            <h1 className="text-4xl font-black tracking-tight">Your Lists</h1>
          </div>
          <p className="text-lg font-bold text-pink-100 uppercase tracking-wide">
            Manage your saved shop hauls
          </p>
        </div>
      </Card>

      {/* Saved Lists */}
      {savedLists.length > 0 ? (
        <div className="grid gap-4">
          {savedLists
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map((list) => {
              const total = calculateListTotal(list);
              const isExpanded = expandedList === list.id;

              return (
                <Card key={list.id} className="p-6 bg-white border-2 border-slate-200 rounded-3xl shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-slate-800 mb-2">{list.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-xl text-slate-600 font-bold text-xs uppercase">
                          <Calendar className="size-3" />
                          {list.createdAt.toLocaleDateString()}
                        </span>
                        <Badge variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-100 border-none rounded-xl px-3 py-1 font-bold">
                          {list.items.length} items
                        </Badge>
                        <span className="flex items-center gap-1 font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl text-sm">
                          <DollarSign className="size-4" />
                          {total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setExpandedList(isExpanded ? null : list.id)}
                        className={`rounded-xl border-2 font-bold flex gap-2 ${
                          isExpanded ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {isExpanded ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        {isExpanded ? 'Hide' : 'View'}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl border-2 border-slate-200">
                            <Trash2 className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black">Delete this list?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium">
                              Are you sure you want to delete "{list.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel className="rounded-xl font-bold border-2">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(list.id, list.name)}
                              className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold"
                            >
                              Delete List
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t-2 border-slate-100">
                      <h4 className="font-black mb-4 text-slate-400 text-xs uppercase tracking-widest">Items in list</h4>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {list.items.map((itemId) => {
                          const product = products.find((p) => p.id === itemId);
                          if (!product) return null;

                          const prices = product.prices.map((p) => p.salePrice || p.price);
                          const cheapestPrice = Math.min(...prices);
                          const cheapestStore = product.prices.find(
                            (p) => (p.salePrice || p.price) === cheapestPrice
                          );

                          return (
                            <Card key={itemId} className="p-4 bg-slate-50 border-none rounded-2xl">
                              <div className="flex justify-between items-start mb-1">
                                <h5 className="font-bold text-slate-800">{product.name}</h5>
                                <span className="font-black text-emerald-600">${cheapestPrice.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                                  {product.unit}
                                </span>
                                <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-500">
                                  {cheapestStore?.storeName}
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
        <Card className="p-16 text-center bg-white border-2 border-dashed border-slate-200 rounded-3xl">
          <div className="bg-slate-50 size-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <ListChecks className="size-12 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Nothing saved yet!</h3>
          <p className="text-slate-500 font-medium mb-8 max-w-xs mx-auto">
            Your shopping lists will appear here once you've saved them from the search page.
          </p>
          <Button asChild className="bg-pink-600 hover:bg-pink-700 text-white rounded-2xl px-10 py-6 text-lg font-bold shadow-md">
            <a href="/">Find Groceries</a>
          </Button>
        </Card>
      )}
    </div>
  );
}