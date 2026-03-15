import { useState, useEffect } from 'react';
import { deleteList, deleteRecipe, getSavedLists, getSavedRecipes } from '../utils/storage';
import { SavedRecipe, ShoppingList } from '../data/types';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Calendar, ChefHat, DollarSign, Eye, EyeOff, ListChecks, ShoppingCart, Trash2 } from 'lucide-react';
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
import { RecipeMarkdown } from '../components/RecipeMarkdown';

export function SavedLists() {
  const [savedLists, setSavedLists] = useState<ShoppingList[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [expandedList, setExpandedList] = useState<string | null>(null);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);

  useEffect(() => {
    loadSaves();
  }, []);

  const loadSaves = () => {
    setSavedLists(getSavedLists());
    setSavedRecipes(getSavedRecipes());
  };

  const handleDeleteList = (id: string, name: string) => {
    deleteList(id);
    loadSaves();
    toast.success(`Deleted "${name}"`);
  };

  const handleDeleteRecipe = (id: string, name: string) => {
    deleteRecipe(id);
    loadSaves();
    toast.success(`Deleted "${name}"`);
  };

  const calculateListTotal = (list: ShoppingList) =>
    list.items.reduce((total, item) => total + item.price, 0);

  const sortByDate = <T extends { createdAt: Date }>(a: T, b: T) =>
    b.createdAt.getTime() - a.createdAt.getTime();

  const hasSaved = savedLists.length > 0 || savedRecipes.length > 0;

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="text-center py-10">
        <h1 className="text-6xl font-black text-primary italic uppercase tracking-tighter mb-3">
          Your Saves
        </h1>
        <p className="text-primary/60 font-black uppercase text-[10px] tracking-[0.4em]">
          Saved lists and recipes, ready to revisit
        </p>
      </div>

      {hasSaved ? (
        <div className="space-y-12">
          <section className="space-y-6">
            <div className="max-w-4xl mx-auto px-2">
              <h2 className="text-3xl font-black text-primary uppercase tracking-tight">Saved Lists</h2>
              <p className="text-primary/50 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">
                Your shopping hauls
              </p>
            </div>

            {savedLists.length > 0 ? (
              <div className="grid gap-8 max-w-4xl mx-auto">
                {[...savedLists].sort(sortByDate).map((list) => {
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
                              {list.items.length} {list.items.length === 1 ? 'item' : 'items'}
                            </Badge>
                            <span className="font-black text-primary italic text-2xl tracking-tighter">
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
                                  onClick={() => handleDeleteList(list.id, list.name)}
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
                          <h4 className="font-black mb-6 text-primary/40 text-[10px] uppercase tracking-[0.3em]">
                            Items in haul
                          </h4>
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {list.items.map((item, idx) => (
                              <div
                                key={`${item.id}-${idx}`}
                                className="p-5 bg-primary/5 border-2 border-primary/20 rounded-2xl hover:border-primary transition-colors"
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <h5 className="font-black text-primary uppercase text-sm leading-tight tracking-tight">
                                    {item.name}
                                  </h5>
                                  <span className="font-black text-primary italic">
                                    ${item.price.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  {item.unit && (
                                    <span className="text-[10px] font-black uppercase text-primary/40 tracking-widest">
                                      {item.unit}
                                    </span>
                                  )}
                                  {item.qty != null && item.qty > 1 && (
                                    <span className="text-[10px] font-black uppercase text-primary/40 tracking-widest">
                                      ×{item.qty}
                                    </span>
                                  )}
                                  <span className="text-[9px] font-black uppercase bg-white px-2 py-1 rounded-md border-2 border-primary/10 text-primary/60">
                                    {item.store}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto p-8 text-center border-4 border-dashed border-primary/20 rounded-[2rem] bg-white/50">
                <p className="text-primary/60 font-black uppercase text-[10px] tracking-[0.3em]">
                  No lists saved yet
                </p>
              </div>
            )}
          </section>

          <section className="space-y-6">
            <div className="max-w-4xl mx-auto px-2">
              <h2 className="text-3xl font-black text-primary uppercase tracking-tight">Saved Recipes</h2>
              <p className="text-primary/50 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">
                Your meal ideas and ingredient lists
              </p>
            </div>

            {savedRecipes.length > 0 ? (
              <div className="grid gap-8 max-w-4xl mx-auto">
                {[...savedRecipes].sort(sortByDate).map((recipe) => {
                  const isExpanded = expandedRecipe === recipe.id;

                  return (
                    <div
                      key={recipe.id}
                      className="bg-white border-4 border-primary p-8 rounded-[2.5rem] shadow-[10px_10px_0px_0px_rgba(93,130,193,0.2)] hover:shadow-[14px_14px_0px_0px_#5D82C1] transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                          <h3 className="text-3xl font-black text-primary italic uppercase tracking-tight mb-3">
                            {recipe.name}
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            <span className="flex items-center gap-1.5 bg-primary/5 px-4 py-1.5 rounded-full border-2 border-primary/10 text-primary font-black text-[10px] uppercase tracking-widest">
                              <Calendar className="size-3" />
                              {recipe.createdAt.toLocaleDateString()}
                            </span>
                            <Badge className="bg-secondary border-2 border-primary text-primary rounded-full px-4 py-1.5 font-black uppercase text-[10px] tracking-widest">
                              {recipe.ingredients.length} {recipe.ingredients.length === 1 ? 'item' : 'items'}
                            </Badge>
                            <span className="font-black text-primary italic text-2xl tracking-tighter">
                              ${recipe.totalPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            onClick={() => setExpandedRecipe(isExpanded ? null : recipe.id)}
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
                                  Delete recipe?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-primary/60 font-bold uppercase text-xs tracking-widest">
                                  Are you sure you want to delete "{recipe.name}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="gap-3 mt-6">
                                <AlertDialogCancel className="rounded-full border-4 border-primary font-black uppercase tracking-widest h-12">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteRecipe(recipe.id, recipe.name)}
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
                          <div className="grid lg:grid-cols-2 gap-8">
                            <div className="bg-primary/5 rounded-2xl border-2 border-primary/20 p-6">
                              <div className="flex items-center gap-2 mb-4">
                                <ChefHat className="size-5 text-primary" />
                                <span className="font-black text-primary uppercase text-xs tracking-widest">Recipe</span>
                              </div>
                              <RecipeMarkdown markdown={recipe.recipeMarkdown} />
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <ShoppingCart className="size-5 text-primary" />
                                  <span className="font-black text-primary uppercase text-xs tracking-widest">
                                    Shopping List
                                    <span className="ml-2 text-[10px] bg-accent px-2 py-0.5 rounded-full border border-primary/20">
                                      {recipe.ingredients.length} ITEMS
                                    </span>
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-primary font-black">
                                  <DollarSign className="size-4" />
                                  <span className="text-2xl italic tracking-tighter">
                                    {recipe.totalPrice.toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                {recipe.ingredients.map((ing) => (
                                  <div
                                    key={ing.id}
                                    className="flex items-center justify-between p-3 bg-background border-2 border-primary/20 rounded-xl hover:border-primary transition-all group"
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
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto p-8 text-center border-4 border-dashed border-primary/20 rounded-[2rem] bg-white/50">
                <p className="text-primary/60 font-black uppercase text-[10px] tracking-[0.3em]">
                  No recipes saved yet
                </p>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto p-16 text-center border-4 border-dashed border-primary/20 rounded-[3rem] bg-white/50">
          <div className="bg-accent/20 size-28 rounded-full border-4 border-primary flex items-center justify-center mx-auto mb-8 shadow-[8px_8px_0px_0px_#5D82C1]">
            <ListChecks className="size-14 text-primary" />
          </div>
          <h3 className="text-4xl font-black text-primary italic uppercase tracking-tighter mb-4">
            Nothing saved yet!
          </h3>
          <p className="text-primary/60 font-bold uppercase text-[10px] tracking-[0.2em] mb-12 max-w-xs mx-auto">
            Your saved lists and recipes will appear here
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
