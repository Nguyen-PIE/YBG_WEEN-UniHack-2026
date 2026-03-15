import { useState, useMemo } from 'react';
import { Search, Clock, Users, ChefHat, Loader2, BookOpen, Flame, RefreshCcw, ImageOff } from 'lucide-react';
import { Input } from '../components/ui/input';

// ---------------------------------------------------------------------------
// 1. Types
// ---------------------------------------------------------------------------
interface Ingredient {
  name: string;
  amount: string;
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  calories: number;
  tags: string[];
  ingredients: Ingredient[];
  steps: string[];
  estimatedCost: number;
  matchScore?: number;
}

const DIFFICULTY_STYLE: Record<Recipe['difficulty'], string> = {
  Easy: 'bg-accent/20 border-primary text-primary',
  Medium: 'bg-secondary/20 border-primary text-primary',
  Hard: 'bg-primary/20 border-primary text-primary',
};

// ---------------------------------------------------------------------------
// 2. Mock Data
// ---------------------------------------------------------------------------
const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Banana Oat Pancakes',
    description: 'Fluffy, naturally sweet pancakes made with ripe bananas and rolled oats. Ready in under 20 minutes.',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
    prepTime: 5,
    cookTime: 15,
    servings: 2,
    difficulty: 'Easy',
    calories: 320,
    tags: ['Breakfast', 'Vegetarian', 'Budget'],
    estimatedCost: 3.50,
    matchScore: 98,
    ingredients: [
      { name: 'Ripe bananas', amount: '2 large' },
      { name: 'Rolled oats', amount: '1 cup' },
      { name: 'Eggs', amount: '2' },
      { name: 'Milk', amount: '¼ cup' },
      { name: 'Cinnamon', amount: '½ tsp' },
    ],
    steps: ['Mash the bananas in a bowl.', 'Mix in eggs, milk, and cinnamon.', 'Stir in oats.', 'Cook 2-3 min per side.'],
  },
  {
    id: '2',
    title: 'Apple & Cinnamon Oats',
    description: 'Prep the night before for a stress-free breakfast packed with fibre.',
    image: 'https://images.unsplash.com/photo-1517093157656-b99917c6471c?w=600&q=80',
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    difficulty: 'Easy',
    calories: 410,
    tags: ['Breakfast', 'Meal-Prep', 'No-Cook'],
    estimatedCost: 2.20,
    matchScore: 95,
    ingredients: [{ name: 'Rolled oats', amount: '½ cup' }, { name: 'Milk', amount: '¾ cup' }, { name: 'Apple', amount: '1 grated' }],
    steps: ['Combine ingredients in a jar.', 'Refrigerate overnight.', 'Serve cold.'],
  },
  {
    id: '3',
    title: 'One-Pan Chicken Rice',
    description: 'A hearty weeknight dinner that uses pantry staples and one pan.',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80',
    prepTime: 10,
    cookTime: 30,
    servings: 4,
    difficulty: 'Medium',
    calories: 520,
    tags: ['Dinner', 'Family', 'One-Pan'],
    estimatedCost: 14.00,
    matchScore: 87,
    ingredients: [{ name: 'Chicken thighs', amount: '600g' }, { name: 'Rice', amount: '1.5 cups' }, { name: 'Stock', amount: '3 cups' }],
    steps: ['Sear chicken.', 'Add rice and stock.', 'Simmer for 20 mins.'],
  },
  {
    id: '4',
    title: 'Budget Banana Bread',
    description: 'Turn overripe bananas into a moist loaf. Great for lunchboxes.',
    image: 'https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?w=600&q=80',
    prepTime: 15,
    cookTime: 55,
    servings: 10,
    difficulty: 'Easy',
    calories: 210,
    tags: ['Baking', 'Snack', 'Budget'],
    estimatedCost: 4.50,
    matchScore: 91,
    ingredients: [{ name: 'Bananas', amount: '3' }, { name: 'SR Flour', amount: '2 cups' }, { name: 'Eggs', amount: '2' }],
    steps: ['Mash bananas.', 'Mix wet then dry.', 'Bake at 180C for 50 mins.'],
  },
  {
    id: '5',
    title: 'Speedy Apple Slaw',
    description: 'Crunchy, fresh, and ready in 10 minutes. A light lunch.',
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80',
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    difficulty: 'Easy',
    calories: 380,
    tags: ['Lunch', 'No-Cook', 'Quick'],
    estimatedCost: 5.80,
    matchScore: 83,
    ingredients: [{ name: 'Wraps', amount: '2' }, { name: 'Apple', amount: '1' }, { name: 'Cabbage', amount: '1 cup' }],
    steps: ['Shred apple and cabbage.', 'Mix with yogurt.', 'Roll in wraps.'],
  },
  {
    id: '6',
    title: 'Creamy Tomato Pasta',
    description: 'A rich restaurant-worthy sauce from simple pantry staples.',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80',
    prepTime: 5,
    cookTime: 20,
    servings: 4,
    difficulty: 'Easy',
    calories: 490,
    tags: ['Dinner', 'Vegetarian', 'Family'],
    estimatedCost: 6.00,
    matchScore: 79,
    ingredients: [{ name: 'Pasta', amount: '400g' }, { name: 'Can Tomatoes', amount: '400g' }, { name: 'Cream', amount: '100ml' }],
    steps: ['Boil pasta.', 'Simmer tomatoes and garlic.', 'Add cream and toss.'],
  },
];

// ---------------------------------------------------------------------------
// 3. Sub-Components
// ---------------------------------------------------------------------------

function RecipeCard({ recipe, onSelect }: { recipe: Recipe; onSelect: (r: Recipe) => void }) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div 
      className="bg-white border-4 border-primary rounded-[2.5rem] shadow-[10px_10px_0px_0px_rgba(93,130,193,0.15)] hover:shadow-[14px_14px_0px_0px_#5D82C1] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer flex flex-col overflow-hidden group"
      onClick={() => onSelect(recipe)}
    >
      <div className="relative h-56 bg-primary/5 overflow-hidden border-b-4 border-primary/10">
        <img 
          src={recipe.image} 
          alt={recipe.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=600&q=80";
          }}
        />
        {recipe.matchScore !== undefined && (
          <div className="absolute top-4 right-4 bg-secondary border-4 border-primary text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-[4px_4px_0px_0px_#5D82C1]">
            {recipe.matchScore}% Match
          </div>
        )}
      </div>
      
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-black text-2xl leading-none uppercase tracking-tighter text-primary italic">{recipe.title}</h3>
          <div className={`text-[10px] font-black uppercase px-2 py-0.5 border-2 rounded-md ${DIFFICULTY_STYLE[recipe.difficulty]}`}>
            {recipe.difficulty}
          </div>
        </div>
        <p className="text-primary/50 text-xs font-bold uppercase leading-relaxed line-clamp-2">{recipe.description}</p>
        <div className="flex items-center justify-between pt-4 border-t-2 border-primary/5">
          <div className="flex gap-4">
            <span className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-tighter">
              <Clock className="size-3" /> {totalTime}M
            </span>
            <span className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-tighter">
              <Flame className="size-3" /> {recipe.calories}C
            </span>
          </div>
          <span className="text-xl font-black text-primary italic tracking-tighter">
            ${recipe.estimatedCost.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

function RecipeDetail({ recipe, onBack }: { recipe: Recipe; onBack: () => void }) {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-primary/40 hover:text-primary transition-colors flex items-center gap-2">
        ← Back to list
      </button>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="aspect-square border-4 border-primary rounded-[3rem] overflow-hidden shadow-[12px_12px_0px_0px_#5D82C1]">
            <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
          </div>
          <div className="bg-secondary/10 border-4 border-primary p-6 rounded-3xl flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-primary tracking-widest">Est. Cost</span>
            <span className="text-4xl font-black text-primary italic tracking-tighter">${recipe.estimatedCost.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-5xl font-black text-primary italic uppercase tracking-tighter mb-4">{recipe.title}</h2>
            <div className="flex gap-2 flex-wrap">
              {recipe.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-accent/20 border-2 border-primary rounded-lg text-[9px] font-black uppercase tracking-widest text-primary">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white border-4 border-primary p-8 rounded-[2rem] shadow-[10px_10px_0px_0px_rgba(93,130,193,0.1)]">
            <h4 className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs mb-4">
              <BookOpen className="size-4" /> Ingredients
            </h4>
            <ul className="space-y-3">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex justify-between border-b-2 border-primary/5 pb-2 text-[10px] font-black text-primary uppercase">
                  <span>{ing.name}</span>
                  <span className="text-primary/40">{ing.amount}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border-4 border-primary p-8 rounded-[2rem] shadow-[10px_10px_0px_0px_rgba(93,130,193,0.1)]">
            <h4 className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs mb-6">
              <ChefHat className="size-4" /> Method
            </h4>
            <ol className="space-y-6">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 size-6 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center">{i + 1}</span>
                  <p className="text-[11px] font-bold text-primary uppercase leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Main Page Component
// ---------------------------------------------------------------------------
export function Recipes() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const handleSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setHasSearched(true);
    }, 900);
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    MOCK_RECIPES.forEach((r) => r.tags.forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, []);

  const displayed = useMemo(() => {
    let results = MOCK_RECIPES;

    if (activeTag) {
      results = results.filter((r) => r.tags.includes(activeTag));
    }

    if (hasSearched && query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(q))
      );
    }

    return [...results].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  }, [hasSearched, query, activeTag]);

  if (selectedRecipe) {
    return <RecipeDetail recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} />;
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="py-16 text-center">
        <h1 className="text-6xl md:text-8xl font-black text-primary italic uppercase tracking-tighter leading-none">
          Recipe Finder
        </h1>
        <p className="text-primary/60 font-black uppercase text-[10px] tracking-[0.4em] mt-6">
          Powered by Elasticsearch for smart matching
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-10">
        <div className="relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-accent p-2 rounded-xl border-4 border-primary shadow-[2px_2px_0px_0px_black] z-10">
            <Search className="size-6 text-primary" />
          </div>
          <Input
            value={query}
            onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value === '') setHasSearched(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder='What is in your fridge?'
            className="h-24 pl-24 pr-48 text-2xl border-4 border-primary bg-white rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(93,130,193,0.2)] font-black italic"
          />
          <button
            onClick={handleSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-16 px-8 bg-secondary border-4 border-primary rounded-[1.5rem] text-primary font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#5D82C1]"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Find"}
          </button>
        </div>

        <div className="flex gap-3 flex-wrap justify-center">
          <button onClick={() => {setActiveTag(null); setHasSearched(false);}} className={`px-4 py-1.5 rounded-full border-4 border-primary font-black uppercase text-[10px] tracking-widest ${activeTag === null ? 'bg-primary text-white shadow-[4px_4px_0px_0px_rgba(93,130,193,0.3)]' : 'bg-white text-primary/40 hover:border-primary transition-all'}`}>All</button>
          {allTags.map((tag) => (
            <button key={tag} onClick={() => {setActiveTag(tag); setHasSearched(false);}} className={`px-4 py-1.5 rounded-full border-4 border-primary font-black uppercase text-[10px] tracking-widest ${activeTag === tag ? 'bg-secondary text-primary shadow-[4px_4px_0px_0px_#5D82C1]' : 'bg-white text-primary/40 hover:border-primary transition-all'}`}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {displayed.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onSelect={setSelectedRecipe} />
          ))}
        </div>
      </div>
    </div>
  );
}