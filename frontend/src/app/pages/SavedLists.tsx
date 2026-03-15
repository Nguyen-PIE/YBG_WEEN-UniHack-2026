import { useState, useEffect } from 'react';
import { getSavedLists, deleteList } from '../utils/storage';
import { ShoppingList, products } from '../data/mockData';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ListChecks, Trash2, Calendar, DollarSign, Eye, EyeOff, X } from 'lucide-react';
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
import { Link } from 'react-router';

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
    <div className="space-y-12 pb-20">
      {/* Header - Transparent & Floating */}
      <div className="text-center py-10">
        <div className="flex items-center justify-center gap-4 mb-3">
          <h1 className="text-6xl font-black text-primary italic uppercase tracking-tighter">
            Your Lists
          </h1>
        </div>
        <p className="text-primary/60 font-black uppercase text-[10px] tracking-[0.4em]">
          Manage your saved lists
        </p>
      </div>

      {/* Saved Lists Content */}
      {savedLists.length > 0 ? (
        <div className="grid gap-8 max-w-4xl mx-auto">
          {savedLists
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map((list) => {
              const total = calculateListTotal(list);
              const isExpanded = expandedList === list.id;

              return (
                <div 
                  key={list.id} 
                  className="bg-white border-4 border-primary p-8 rounded-[2.5rem] shadow-[10px_10px_0px_0px_rgba(93,130,193,0.2)] hover:shadow-[14px_14px_0px_0px_#5D82C1] transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <h3 className="text-3xl font-black text-primary italic uppercase tracking-tight mb-3">
                        {list.name}
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        <span className="flex items-center gap-1.5 bg-primary/5 px-4 py-1.5 rounded-full border-2 border-primary/10 text-primary font-black text-[10px] uppercase tracking-widest">
                          <Calendar className="size-3" />
                          {list.createdAt.toLocaleDateString()}
                        </span>
                        <Badge className="bg-secondary border-2 border-primary text-primary rounded-full px-4 py-1.5 font-black uppercase text-[10px] tracking-widest">
                          {list.items.length} items
                        </Badge>
                        <span className="flex items-center gap-1 font-black text-primary italic text-2xl tracking-tighter">
                          ${total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setExpandedList(isExpanded ? null : list.id)}
                        className={`h-14 px-6 rounded-full border-4 font-black uppercase tracking-widest flex gap-2 transition-all ${
                          isExpanded 
                            ? 'bg-primary text-white border-primary shadow-[4px_4px_0px_0px_rgba(45,62,97,0.3)]' 
                            : 'bg-white border-primary text-primary shadow-[4px_4px_0px_0px_#5D82C1]'
                        }`}
                      >
                        {isExpanded ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        {isExpanded ? 'Hide' : 'View'}
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className="h-14 w-14 p-0 bg-white border-4 border-primary text-primary hover:text-secondary rounded-full shadow-[4px_4px_0px_0px_#5D82C1] transition-all">
                            <Trash2 className="size-6" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[3rem] border-4 border-primary bg-background shadow-[15px_15px_0px_0px_#5D82C1]">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-3xl font-black text-primary italic uppercase tracking-tighter">
                              Delete list?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-primary/60 font-bold uppercase text-xs tracking-widest">
                              Are you sure you want to delete "{list.name}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-3 mt-6">
                            <AlertDialogCancel className="rounded-full border-4 border-primary font-black uppercase tracking-widest h-12">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(list.id, list.name)}
                              className="bg-secondary border-4 border-primary text-primary rounded-full font-black uppercase tracking-widest h-12"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-8 pt-8 border-t-4 border-primary/10">
                      <h4 className="font-black mb-6 text-primary/40 text-[10px] uppercase tracking-[0.3em]">Items in haul</h4>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {list.items.map((itemId) => {
                          const product = products.find((p) => p.id === itemId);
                          if (!product) return null;

                          const prices = product.prices.map((p) => p.salePrice || p.price);
                          const cheapestPrice = Math.min(...prices);
                          const cheapestStore = product.prices.find(
                            (p) => (p.salePrice || p.price) === cheapestPrice
                          );

                          return (
                            <div key={itemId} className="p-5 bg-primary/5 border-2 border-primary/20 rounded-2xl group hover:border-primary transition-colors">
                              <div className="flex justify-between items-start mb-3">
                                <h5 className="font-black text-primary uppercase text-sm leading-tight tracking-tight">{product.name}</h5>
                                <span className="font-black text-primary italic">${cheapestPrice.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-primary/40 tracking-widest">
                                  {product.unit}
                                </span>
                                <span className="text-[9px] font-black uppercase bg-white px-2 py-1 rounded-md border-2 border-primary/10 text-primary/60">
                                  {cheapestStore?.storeName}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      ) : (
        /* Empty State - Scrapbook Style */
        <div className="max-w-2xl mx-auto p-16 text-center border-4 border-dashed border-primary/20 rounded-[3rem] bg-white/50">
          <div className="bg-accent/20 size-28 rounded-full border-4 border-primary flex items-center justify-center mx-auto mb-8 shadow-[8px_8px_0px_0px_#5D82C1]">
            <ListChecks className="size-14 text-primary" />
          </div>
          <h3 className="text-4xl font-black text-primary italic uppercase tracking-tighter mb-4">Nothing saved yet!</h3>
          <p className="text-primary/60 font-bold uppercase text-[10px] tracking-[0.2em] mb-12 max-w-xs mx-auto">
            Your shopping lists will appear here once saved
          </p>
          
          <Link to="/">
          <Button className="w-[90%] md:w-auto h-16 md:h-20 px-6 md:px-12 text-lg md:text-2xl font-black bg-secondary border-4 border-primary text-foreground rounded-full shadow-[6px_6px_0px_0px_#5D82C1] transition-all active:scale-[0.95] uppercase tracking-[0.1em] md:tracking-[0.25em]">
            Find Groceries
          </Button>
          </Link>
        </div>
      )}
    </div>
  );
}