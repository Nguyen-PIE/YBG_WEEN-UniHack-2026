import React, { useState, useRef, useEffect } from 'react';
import { ProductWithPrices } from '../data/types';
import { searchProducts } from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface ManualListCreatorProps {
  onCreateList: (items: ProductWithPrices[]) => void;
}

export function ManualListCreator({ onCreateList }: ManualListCreatorProps) {
  const [currentItem, setCurrentItem] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced live search for autocomplete suggestions
  useEffect(() => {
    const query = currentItem.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchProducts(query, 8);
        const rankedResults = rankProductsByQuery(query, results);
        const names = rankedResults.map((p) => p.name);
        setSuggestions(names);
        setShowSuggestions(names.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [currentItem]);

  const addItem = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (selectedItems.includes(trimmed)) {
      toast.error('Already in your list!');
    } else {
      setSelectedItems((prev) => [...prev, trimmed]);
      toast.success(`Added ${trimmed}!`);
    }
    setCurrentItem('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeItem = (name: string) => {
    setSelectedItems((prev) => prev.filter((i) => i !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentItem.trim()) addItem(currentItem);
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const findCheapest = async () => {
    if (selectedItems.length === 0) {
      toast.error('Add some items first!');
      return;
    }
    setIsCreating(true);
    const loadingToast = toast.loading('Checking store prices...');
    try {
      const response = await fetch('/api/manual-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: selectedItems }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Server request failed');
      onCreateList(data.items);
      toast.success('Found the best deals!', { id: loadingToast });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Couldn't reach the server: ${message}`, { id: loadingToast });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8 bg-transparent">
      <div className="mb-12 text-center">
        <h2 className="text-5xl font-black text-primary italic uppercase tracking-tighter mb-2">
          Create Your List
        </h2>
        <p className="text-primary/60 font-black uppercase text-[10px] tracking-[0.3em]">
          Add items &amp; we'll find the cheapest prices
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-12 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-4 px-2">
          <div className="bg-accent p-1.5 rounded-lg border-2 border-primary">
            {isSearching ? (
              <Loader2 className="size-4 text-primary animate-spin" />
            ) : (
              <Search className="size-4 text-primary" />
            )}
          </div>
          <span className="text-[10px] font-black uppercase text-primary tracking-widest">
            Find Item
          </span>
        </div>

        <div className="flex gap-3">
          <Input
            ref={inputRef}
            type="text"
            placeholder="e.g. Milk, Bread, Avocado..."
            value={currentItem}
            onChange={(e) => setCurrentItem(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            disabled={isCreating}
            className="h-16 text-xl border-4 border-primary bg-white rounded-2xl focus:ring-0 font-bold placeholder:text-primary/20"
          />
          <Button
            onClick={() => addItem(currentItem)}
            disabled={!currentItem.trim() || isCreating}
            className="h-16 w-16 min-w-16 bg-secondary border-4 border-primary text-foreground rounded-2xl font-black shadow-[4px_4px_0px_0px_#5D82C1] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:scale-95"
          >
            <Plus className="size-6" />
          </Button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <div className="absolute z-20 w-full mt-3 bg-white rounded-3xl shadow-[10px_10px_0px_0px_#5D82C1] border-4 border-primary overflow-hidden">
            {suggestions.map((name) => (
              <button
                key={name}
                onMouseDown={() => addItem(name)}
                className="w-full p-5 text-left flex items-center justify-between border-b-2 border-primary/10 hover:bg-accent/30 transition-colors group"
              >
                <p className="font-black text-primary text-lg uppercase tracking-tight">{name}</p>
                <Plus className="size-5 text-primary group-hover:scale-125 transition-transform" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Shopping Bag */}
      {selectedItems.length > 0 && (
        <div className="mb-12 space-y-8 max-w-2xl mx-auto">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xs font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-1.5 rounded-full border-2 border-primary/20">
              Shopping Bag · {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'}
            </h3>
            <button
              onClick={() => setSelectedItems([])}
              className="text-xs font-black text-secondary uppercase hover:scale-110 transition-all"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {selectedItems.map((name) => (
              <div
                key={name}
                className="flex items-center justify-between p-6 bg-white rounded-3xl border-4 border-primary/10 hover:border-primary transition-all shadow-sm"
              >
                <p className="font-black text-primary text-xl leading-tight uppercase tracking-tighter">
                  {name}
                </p>
                <button
                  onClick={() => removeItem(name)}
                  className="text-primary/20 hover:text-secondary transition-colors"
                >
                  <X className="size-8" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Button */}
      <div className="max-w-2xl mx-auto">
        <Button
          onClick={findCheapest}
          disabled={selectedItems.length === 0 || isCreating}
          className="w-full h-20 text-2xl font-black bg-secondary border-4 border-primary text-foreground rounded-full shadow-[10px_10px_0px_0px_#5D82C1] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all active:scale-[0.95] uppercase tracking-tighter"
        >
          {isCreating ? (
            <Loader2 className="size-8 animate-spin" />
          ) : (
            'Find Best Prices'
          )}
        </Button>
      </div>
    </div>
  );
}

function rankProductsByQuery(query: string, products: ProductWithPrices[]) {
  const normalisedQuery = normaliseString(query);
  return [...products].sort((a, b) => {
    const scoreA = scoreProductCandidate(
      normalisedQuery,
      normaliseString(a.name),
      normaliseString(a.category),
    );
    const scoreB = scoreProductCandidate(
      normalisedQuery,
      normaliseString(b.name),
      normaliseString(b.category),
    );
    if (scoreA !== scoreB) return scoreB - scoreA;
    return a.name.localeCompare(b.name);
  });
}

function scoreProductCandidate(
  normalisedQuery: string,
  normalisedName: string,
  normalisedCategory: string,
) {
  const tokens = normalisedQuery.split(/\s+/).filter(Boolean);
  let score = 0;

  if (normalisedName === normalisedQuery) score += 120;
  if (normalisedName.startsWith(normalisedQuery)) score += 80;
  if (normalisedName.includes(normalisedQuery)) score += 50;

  const nameTokenMatches = tokens.filter((token) => normalisedName.includes(token)).length;
  score += nameTokenMatches * 15;

  if (normalisedCategory.includes(normalisedQuery)) score += 25;
  const categoryTokenMatches = tokens.filter((token) =>
    normalisedCategory.includes(token),
  ).length;
  score += categoryTokenMatches * 10;

  score -= Math.min(30, Math.floor(normalisedName.length / 5));
  return score;
}

function normaliseString(value: string) {
  if (typeof value !== 'string') {
    throw new Error('Expected a string.');
  }
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
