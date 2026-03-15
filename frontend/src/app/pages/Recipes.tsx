import { useState, useMemo } from 'react';
import { Search, Clock, Users, ChefHat, Sparkles, Loader2, BookOpen, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

// ---------------------------------------------------------------------------
// Types
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
  prepTime: number;   // minutes
  cookTime: number;   // minutes
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  calories: number;
  tags: string[];
  ingredients: Ingredient[];
  steps: string[];
  estimatedCost: number; // AUD
  matchScore?: number;  // will be populated by Elastic (0–100)
}

// ---------------------------------------------------------------------------
// Mock data — replace with Elastic API calls
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
    tags: ['Breakfast', 'Vegetarian', 'Budget-Friendly'],
    estimatedCost: 3.50,
    matchScore: 98,
    ingredients: [
      { name: 'Ripe bananas', amount: '2 large' },
      { name: 'Rolled oats', amount: '1 cup' },
      { name: 'Eggs', amount: '2' },
      { name: 'Milk', amount: '¼ cup' },
      { name: 'Cinnamon', amount: '½ tsp' },
      { name: 'Honey', amount: '1 tbsp' },
    ],
    steps: [
      'Mash the bananas in a large bowl until smooth.',
      'Mix in the eggs, milk, and cinnamon.',
      'Stir in oats and let sit for 2 minutes to thicken.',
      'Heat a non-stick pan over medium heat and spray with oil.',
      'Pour ¼ cup batter per pancake and cook 2–3 min per side until golden.',
      'Serve with honey and fresh fruit.',
    ],
  },
  {
    id: '2',
    title: 'Apple & Cinnamon Overnight Oats',
    description: 'Prep the night before for a stress-free breakfast packed with fibre and natural sweetness.',
    image: 'https://images.unsplash.com/photo-1639234220986-d7df02bcb31d?w=600&q=80',
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    difficulty: 'Easy',
    calories: 410,
    tags: ['Breakfast', 'Meal-Prep', 'No-Cook', 'Vegetarian'],
    estimatedCost: 2.20,
    matchScore: 95,
    ingredients: [
      { name: 'Rolled oats', amount: '½ cup' },
      { name: 'Milk', amount: '¾ cup' },
      { name: 'Greek yogurt', amount: '2 tbsp' },
      { name: 'Apple', amount: '1 medium, grated' },
      { name: 'Cinnamon', amount: '½ tsp' },
      { name: 'Chia seeds', amount: '1 tsp' },
    ],
    steps: [
      'Combine oats, milk, yogurt and chia seeds in a jar.',
      'Stir in grated apple and cinnamon.',
      'Cover and refrigerate overnight (or at least 4 hours).',
      'Top with extra apple slices and a sprinkle of cinnamon before serving.',
    ],
  },
  {
    id: '3',
    title: 'One-Pan Chicken & Vegetable Rice',
    description: 'A hearty weeknight dinner that uses pantry staples and one pan. Serves a family of four.',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80',
    prepTime: 10,
    cookTime: 30,
    servings: 4,
    difficulty: 'Medium',
    calories: 520,
    tags: ['Dinner', 'Family', 'One-Pan', 'High-Protein'],
    estimatedCost: 14.00,
    matchScore: 87,
    ingredients: [
      { name: 'Chicken thighs', amount: '600 g, diced' },
      { name: 'Long-grain rice', amount: '1½ cups' },
      { name: 'Chicken stock', amount: '3 cups' },
      { name: 'Frozen peas', amount: '1 cup' },
      { name: 'Carrots', amount: '2, diced' },
      { name: 'Garlic', amount: '3 cloves, minced' },
      { name: 'Olive oil', amount: '2 tbsp' },
      { name: 'Paprika', amount: '1 tsp' },
    ],
    steps: [
      'Heat oil in a large, deep pan over medium-high heat.',
      'Season chicken with paprika, salt and pepper. Sear until golden, ~5 min.',
      'Add garlic and carrots, cook 2 minutes.',
      'Stir in rice, then pour over the stock.',
      'Bring to a boil, then reduce heat, cover and simmer 20 minutes.',
      'Stir in peas, cover and cook a further 5 minutes until rice is tender.',
      'Fluff with a fork and serve.',
    ],
  },
  {
    id: '4',
    title: 'Budget Banana Bread',
    description: 'Turn those overripe bananas into a moist loaf the whole family will love. Great for lunchboxes.',
    image: 'https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?w=600&q=80',
    prepTime: 15,
    cookTime: 55,
    servings: 10,
    difficulty: 'Easy',
    calories: 210,
    tags: ['Baking', 'Snack', 'Freezer-Friendly', 'Vegetarian'],
    estimatedCost: 4.50,
    matchScore: 91,
    ingredients: [
      { name: 'Overripe bananas', amount: '3 large' },
      { name: 'Self-raising flour', amount: '2 cups' },
      { name: 'Caster sugar', amount: '½ cup' },
      { name: 'Butter', amount: '80 g, melted' },
      { name: 'Eggs', amount: '2' },
      { name: 'Vanilla extract', amount: '1 tsp' },
    ],
    steps: [
      'Preheat oven to 180°C. Grease a loaf tin.',
      'Mash bananas in a large bowl.',
      'Whisk in butter, sugar, eggs, and vanilla.',
      'Fold in flour until just combined — do not overmix.',
      'Pour into tin and bake 50–55 minutes until a skewer comes out clean.',
      'Cool in tin for 10 minutes, then turn out onto a rack.',
    ],
  },
  {
    id: '5',
    title: 'Speedy Apple Slaw Wraps',
    description: 'Crunchy, fresh, and ready in 10 minutes. A light lunch that actually fills you up.',
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80',
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    difficulty: 'Easy',
    calories: 380,
    tags: ['Lunch', 'No-Cook', 'Vegetarian', 'Quick'],
    estimatedCost: 5.80,
    matchScore: 83,
    ingredients: [
      { name: 'Large wraps', amount: '2' },
      { name: 'Apple', amount: '1, julienned' },
      { name: 'Red cabbage', amount: '1 cup, shredded' },
      { name: 'Carrot', amount: '1, grated' },
      { name: 'Greek yogurt', amount: '3 tbsp' },
      { name: 'Lemon juice', amount: '1 tbsp' },
      { name: 'Cheddar cheese', amount: '40 g, grated' },
    ],
    steps: [
      'Mix yogurt and lemon juice in a bowl — season with salt and pepper.',
      'Toss apple, cabbage, and carrot through the dressing.',
      'Lay wraps flat and divide the slaw between them.',
      'Sprinkle over the cheese, roll tightly and serve.',
    ],
  },
  {
    id: '6',
    title: 'Creamy Tomato Pasta',
    description: 'A can of tomatoes and a splash of cream transform into a rich restaurant-worthy sauce.',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80',
    prepTime: 5,
    cookTime: 20,
    servings: 4,
    difficulty: 'Easy',
    calories: 490,
    tags: ['Dinner', 'Vegetarian', 'Budget-Friendly', 'Family'],
    estimatedCost: 6.00,
    matchScore: 79,
    ingredients: [
      { name: 'Pasta (penne or rigatoni)', amount: '400 g' },
      { name: 'Canned crushed tomatoes', amount: '400 g tin' },
      { name: 'Thickened cream', amount: '100 ml' },
      { name: 'Garlic', amount: '3 cloves, minced' },
      { name: 'Olive oil', amount: '2 tbsp' },
      { name: 'Parmesan', amount: '40 g, grated' },
      { name: 'Fresh basil', amount: 'handful' },
    ],
    steps: [
      'Cook pasta according to packet instructions. Reserve ½ cup pasta water.',
      'Heat oil in a pan, sauté garlic 1 minute.',
      'Add tomatoes, simmer 10 minutes until slightly thickened.',
      'Stir in cream and simmer 2 more minutes.',
      'Toss pasta through the sauce, adding pasta water to loosen if needed.',
      'Serve topped with parmesan and torn basil.',
    ],
  },
];

const DIFFICULTY_COLOURS: Record<Recipe['difficulty'], string> = {
  Easy: 'bg-green-100 text-green-700',
  Medium: 'bg-amber-100 text-amber-700',
  Hard: 'bg-red-100 text-red-700',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function RecipeCard({
  recipe,
  onSelect,
}: {
  recipe: Recipe;
  onSelect: (r: Recipe) => void;
}) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-2 border-transparent hover:border-pink-300 group"
      onClick={() => onSelect(recipe)}
    >
      <div className="relative h-48 overflow-hidden bg-slate-100">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://placehold.co/600x400/fce7f3/be185d?text=Recipe';
          }}
        />
        {recipe.matchScore !== undefined && (
          <div className="absolute top-2 right-2 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="size-3" />
            {recipe.matchScore}% match
          </div>
        )}
        <div className="absolute bottom-2 left-2">
          <Badge className={`text-xs font-bold ${DIFFICULTY_COLOURS[recipe.difficulty]}`}>
            {recipe.difficulty}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <h3 className="font-black text-lg leading-tight">{recipe.title}</h3>
        <p className="text-slate-500 text-sm line-clamp-2">{recipe.description}</p>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span className="flex items-center gap-1">
            <Clock className="size-4 text-pink-500" />
            {totalTime} min
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-4 text-pink-500" />
            {recipe.servings} serves
          </span>
          <span className="flex items-center gap-1">
            <Flame className="size-4 text-pink-500" />
            {recipe.calories} cal
          </span>
        </div>
        <div className="pt-1 flex items-center justify-between">
          <span className="text-green-600 font-bold text-sm">
            ~${recipe.estimatedCost.toFixed(2)} est.
          </span>
          <div className="flex gap-1 flex-wrap justify-end">
            {recipe.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecipeDetail({
  recipe,
  onBack,
}: {
  recipe: Recipe;
  onBack: () => void;
}) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack} className="mb-2">
        ← Back to recipes
      </Button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: image + meta */}
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden shadow-md h-72">
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://placehold.co/600x400/fce7f3/be185d?text=Recipe';
              }}
            />
          </div>

          <Card className="border-2 border-pink-100">
            <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="size-5 text-pink-500" />
                <div>
                  <p className="text-slate-500">Prep time</p>
                  <p className="font-bold">{recipe.prepTime} min</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="size-5 text-pink-500" />
                <div>
                  <p className="text-slate-500">Cook time</p>
                  <p className="font-bold">{recipe.cookTime} min</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="size-5 text-pink-500" />
                <div>
                  <p className="text-slate-500">Servings</p>
                  <p className="font-bold">{recipe.servings}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ChefHat className="size-5 text-pink-500" />
                <div>
                  <p className="text-slate-500">Difficulty</p>
                  <p className="font-bold">{recipe.difficulty}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estimated cost */}
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-4 flex items-center justify-between">
              <span className="text-green-700 font-bold">Estimated total cost</span>
              <span className="text-2xl font-black text-green-700">
                ~${recipe.estimatedCost.toFixed(2)}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Right: ingredients + steps */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black mb-1">{recipe.title}</h2>
            <p className="text-slate-500">{recipe.description}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {recipe.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <Card className="border-2 border-pink-100">
            <CardHeader className="pb-2 font-black text-lg flex flex-row items-center gap-2">
              <BookOpen className="size-5 text-pink-500" /> Ingredients
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex justify-between text-sm border-b border-slate-100 pb-1 last:border-0">
                    <span className="text-slate-700">{ing.name}</span>
                    <span className="font-semibold text-slate-900">{ing.amount}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Steps */}
          <Card className="border-2 border-pink-100">
            <CardHeader className="pb-2 font-black text-lg flex flex-row items-center gap-2">
              <ChefHat className="size-5 text-pink-500" /> Method
            </CardHeader>
            <CardContent className="pt-0">
              <ol className="space-y-3">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="size-6 min-w-6 rounded-full bg-pink-600 text-white text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <span className="text-slate-700 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export function Recipes() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Simulate an Elastic search request
  const handleSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(false);
    setSelectedRecipe(null);
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
    if (activeTag) results = results.filter((r) => r.tags.includes(activeTag));
    if (hasSearched && query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(q))
      );
    }
    return results.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  }, [hasSearched, query, activeTag]);

  if (selectedRecipe) {
    return (
      <RecipeDetail recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="bg-gradient-to-r from-orange-500 to-pink-600 text-white p-10 rounded-3xl border-none shadow-md">
        <div className="flex items-center gap-3 mb-3">
          <ChefHat className="size-10" />
          <h1 className="text-4xl font-black">Recipe Finder</h1>
        </div>
        <p className="text-xl opacity-95 font-medium">
          Tell us what's in your fridge — powered by Elasticsearch for smart recipe matching.
        </p>
      </Card>

      {/* Search bar */}
      <Card className="p-6 border-2 border-pink-100">
        <p className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-pink-500" />
          Search by ingredient, dish name, or dietary tag
        </p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            <Input
              className="pl-10 h-12 text-base border-2 focus-visible:border-pink-400"
              placeholder='e.g. "banana", "chicken rice", "vegetarian"…'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button
            onClick={handleSearch}
            className="h-12 px-6 bg-pink-600 hover:bg-pink-700 font-bold"
            disabled={loading || !query.trim()}
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              'Find Recipes'
            )}
          </Button>
        </div>
      </Card>

      {/* Tag filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant={activeTag === null ? 'default' : 'outline'}
          onClick={() => setActiveTag(null)}
          className={activeTag === null ? 'bg-pink-600 hover:bg-pink-700' : ''}
        >
          All
        </Button>
        {allTags.map((tag) => (
          <Button
            key={tag}
            size="sm"
            variant={activeTag === tag ? 'default' : 'outline'}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            className={activeTag === tag ? 'bg-pink-600 hover:bg-pink-700' : ''}
          >
            {tag}
          </Button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-500">
          <Loader2 className="size-12 animate-spin text-pink-500" />
          <p className="text-lg font-semibold">Searching recipes with Elasticsearch…</p>
          <p className="text-sm">Matching ingredients, tags, and dietary preferences</p>
        </div>
      ) : displayed.length > 0 ? (
        <>
          {hasSearched && (
            <p className="text-sm text-slate-500 font-medium">
              Found <span className="font-bold text-slate-900">{displayed.length}</span> recipes
              {query && <> matching "<span className="text-pink-600">{query}</span>"</>}
            </p>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayed.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onSelect={setSelectedRecipe} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-24 text-slate-400">
          <ChefHat className="size-16 mx-auto mb-4 opacity-30" />
          <p className="text-xl font-bold">No recipes found</p>
          <p className="text-sm mt-2">Try a different ingredient or remove the filter</p>
        </div>
      )}
    </div>
  );
}
