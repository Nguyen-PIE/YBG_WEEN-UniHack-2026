import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import OpenAI from "openai";
import { getElasticConfig, parseJsonBody } from "./_lib/elastic.js";

// Load .env.local from the project root (same as Python's load_dotenv())
const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env.local") });

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_ELASTIC_RESULTS = 600;
const MIN_SEMANTIC_RESULTS = 50;
const MIN_QUERY_RESULTS = 12;
const KNN_NUM_CANDIDATES = 1200;
const MAX_ITEMS_FOR_LLM = 60;
const MAX_ITEMS_PER_TERM = 6;
const MAX_ITEMS_PER_CATEGORY = 5;
const BUDGET_TOLERANCE = 2.0;
const MAX_LLM_ATTEMPTS = 6;
const MODEL_TEMPERATURE = 0.8;
const MODEL_TOP_P = 0.9;
const EMBEDDING_MODEL = "text-embedding-3-small";

const MACRO_GROUPS = ["protein", "carb", "veg"];

const MACRO_KEYWORDS = {
  protein: [
    "beef", "bison", "chicken", "duck", "egg", "eggs", "fish", "ham", "lamb",
    "mince", "pork", "prawn", "salmon", "sardine", "sausage", "steak", "tempeh",
    "tofu", "tuna", "turkey", "yogurt", "yoghurt", "cheese", "milk", "protein",
    "lentil", "lentils", "chickpea", "chickpeas", "bean", "beans",
  ],
  carb: [
    "bagel", "bread", "bun", "cereal", "couscous", "corn", "flour", "flatbread",
    "noodle", "noodles", "oat", "oats", "pasta", "pita", "potato", "potatoes",
    "rice", "roll", "spaghetti", "tortilla", "wrap", "quinoa", "sweet potato",
  ],
  veg: [
    "apple", "banana", "broccoli", "carrot", "capsicum", "cauliflower", "cabbage",
    "celery", "cucumber", "eggplant", "garlic", "grape", "kale", "lettuce",
    "mushroom", "onion", "orange", "pear", "peas", "pepper", "spinach",
    "strawberry", "tomato", "zucchini",
  ],
};

const MEAL_TYPE_MAP = {
  any: "Any",
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

const TIME_CONSTRAINT_MAP = {
  any: "Any",
  "5": "5 minutes", "5m": "5 minutes", "5min": "5 minutes",
  "10": "10 minutes", "10m": "10 minutes", "10min": "10 minutes",
  "15": "15 minutes", "15m": "15 minutes", "15min": "15 minutes",
  "30": "30 minutes", "30m": "30 minutes", "30min": "30 minutes",
  "1hr+": "1 hour or more", "1h+": "1 hour or more",
  "1hour+": "1 hour or more", "60+": "1 hour or more",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requirePositiveNumber(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid ${label}: expected a positive number.`);
  }
  return value;
}

function normaliseText(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function categoryKey(item) {
  const raw = item.category || item.term || "";
  const key = normaliseText(raw);
  return key || "unknown";
}

function keywordInText(text, keyword) {
  if (keyword.includes(" ")) return text.includes(keyword);
  return new RegExp(`(?:^| )${keyword}(?:$| )`, "i").test(text);
}

function classifyMacroGroup(item) {
  const parts = [item.name, item.category || "", item.term || ""];
  const combined = normaliseText(parts.filter(Boolean).join(" "));
  if (!combined) throw new Error(`Cannot classify macro group: ${item.id}`);

  for (const group of MACRO_GROUPS) {
    const keywords = MACRO_KEYWORDS[group] || [];
    if (keywords.some((kw) => keywordInText(combined, kw))) return group;
  }
  return "other";
}

function resolveRecipeQuery(input) {
  if (!input || !input.trim()) return null;
  return input.trim();
}

function resolveMealType(input) {
  if (!input || !input.trim()) return "Any";
  const normalised = input.trim().toLowerCase();
  if (normalised in MEAL_TYPE_MAP) return MEAL_TYPE_MAP[normalised];
  const allowed = Object.keys(MEAL_TYPE_MAP).filter((k) => k !== "any").join(", ");
  throw new Error(`Meal type must be one of: ${allowed}.`);
}

function resolveTimeConstraint(input) {
  if (!input || !input.trim()) return "Any";
  const normalised = input.trim().toLowerCase().replace(/\s+/g, "");
  if (normalised in TIME_CONSTRAINT_MAP) return TIME_CONSTRAINT_MAP[normalised];
  const allowed = Object.keys(TIME_CONSTRAINT_MAP).filter((k) => k !== "any").join(", ");
  throw new Error(`Time constraint must be one of: ${allowed}.`);
}

function extractQueryTokens(query) {
  if (!query) return [];
  const tokens = normaliseText(query)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);

  const stopWords = new Set(["and", "or", "with", "without", "for", "the", "a", "an", "of", "to"]);
  return tokens.filter((token) => !stopWords.has(token));
}

function scoreItemForQuery(item, tokens) {
  if (tokens.length === 0) return 0;
  const haystack = normaliseText([item.name, item.category, item.term].filter(Boolean).join(" "));
  let score = 0;
  for (const token of tokens) {
    if (keywordInText(haystack, token)) score += 1;
  }
  return score;
}

function filterItemsByQuery(items, query) {
  const tokens = extractQueryTokens(query);
  if (tokens.length === 0) return items;

  const scored = items
    .map((item) => ({
      item,
      score: scoreItemForQuery(item, tokens),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.item.price - b.item.price;
    });

  return scored.map((entry) => entry.item);
}

// ─── OpenAI ───────────────────────────────────────────────────────────────────

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Missing required environment variable: OPENAI_API_KEY.");
  }
  return new OpenAI({ apiKey });
}

async function embedQuery(client, text) {
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  if (!response.data || response.data.length === 0) {
    throw new Error("Embedding response was empty.");
  }
  return response.data[0].embedding;
}

// ─── Elasticsearch ────────────────────────────────────────────────────────────

async function fetchAffordableItems(budget, semanticQuery, client) {
  if (budget <= 0) throw new Error("Budget must be greater than zero.");

  const { searchUrl, headers } = getElasticConfig();

  let elasticQuery;
  if (semanticQuery) {
    const queryVector = await embedQuery(client, semanticQuery);
    elasticQuery = {
      knn: {
        field: "embedding",
        query_vector: queryVector,
        k: MAX_ELASTIC_RESULTS,
        num_candidates: KNN_NUM_CANDIDATES,
        filter: { range: { price: { lte: budget } } },
      },
      _source: ["product_id", "product_name", "category", "price", "store_name", "term"],
    };
  } else {
    elasticQuery = {
      size: MAX_ELASTIC_RESULTS,
      _source: ["product_id", "product_name", "category", "price", "store_name", "term"],
      query: { range: { price: { lte: budget } } },
    };
  }

  const response = await fetch(searchUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(elasticQuery),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Elasticsearch query failed: ${text}`);
  }

  const data = await response.json();
  const hits = data?.hits?.hits ?? [];
  if (hits.length === 0) {
    throw new Error(`No items found under $${budget.toFixed(2)}.`);
  }

  return hits.map((hit) => normaliseItem(hit._source));
}

function normaliseItem(source) {
  const required = ["product_id", "product_name", "category", "price", "store_name", "term"];
  for (const field of required) {
    if (source[field] === undefined || source[field] === null) {
      throw new Error(`Missing ${field} in Elasticsearch document.`);
    }
  }
  const price = parseFloat(source.price);
  if (!Number.isFinite(price)) {
    throw new Error(`Invalid price value: ${source.price}`);
  }
  return {
    id: String(source.product_id),
    name: String(source.product_name),
    category: String(source.category),
    price,
    store: String(source.store_name),
    term: String(source.term),
  };
}

// ─── Item Selection ───────────────────────────────────────────────────────────

function splitPriceBands(items) {
  const prices = items.map((i) => i.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (maxPrice === minPrice) return { mid: [...items] };

  const lowCutoff = minPrice + (maxPrice - minPrice) * 0.33;
  const highCutoff = minPrice + (maxPrice - minPrice) * 0.66;

  const bands = { low: [], mid: [], high: [] };
  for (const item of items) {
    if (item.price <= lowCutoff) bands.low.push(item);
    else if (item.price <= highCutoff) bands.mid.push(item);
    else bands.high.push(item);
  }
  return bands;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function selectItems(items) {
  shuffle(items);
  const bands = splitPriceBands(items);
  for (const bandItems of Object.values(bands)) shuffle(bandItems);

  let bandOrder = Object.keys(bands).filter((name) => bands[name].length > 0);
  if (bandOrder.length === 0) throw new Error("No items available after price band split.");

  const selected = [];
  const seenIds = new Set();
  const countsByTerm = {};
  const countsByCategory = {};
  const deferred = [];

  function takeFromBand(bandItems, enforceCategoryCap) {
    while (bandItems.length > 0) {
      const item = bandItems.shift();
      if (seenIds.has(item.id)) continue;

      const term = item.term;
      const category = categoryKey(item);

      if (enforceCategoryCap && (countsByCategory[category] || 0) >= MAX_ITEMS_PER_CATEGORY) {
        deferred.push(item);
        continue;
      }
      if ((countsByTerm[term] || 0) >= MAX_ITEMS_PER_TERM) {
        deferred.push(item);
        continue;
      }

      selected.push(item);
      seenIds.add(item.id);
      countsByTerm[term] = (countsByTerm[term] || 0) + 1;
      countsByCategory[category] = (countsByCategory[category] || 0) + 1;
      return;
    }
  }

  let bandIndex = 0;
  while (selected.length < MAX_ITEMS_FOR_LLM && bandOrder.length > 0) {
    const bandName = bandOrder[bandIndex % bandOrder.length];
    const bandItems = bands[bandName];
    bandIndex++;

    takeFromBand(bandItems, true);
    bandOrder = bandOrder.filter((name) => bands[name].length > 0);
  }

  if (selected.length < MAX_ITEMS_FOR_LLM) {
    const remaining = [...deferred, ...Object.values(bands).flat()];
    shuffle(remaining);
    for (const item of remaining) {
      if (selected.length >= MAX_ITEMS_FOR_LLM) break;
      if (seenIds.has(item.id)) continue;
      if ((countsByTerm[item.term] || 0) >= MAX_ITEMS_PER_TERM) continue;

      selected.push(item);
      seenIds.add(item.id);
      countsByTerm[item.term] = (countsByTerm[item.term] || 0) + 1;
      const category = categoryKey(item);
      countsByCategory[category] = (countsByCategory[category] || 0) + 1;
    }
  }

  if (selected.length === 0) throw new Error("No items available after selection.");

  for (const item of selected) {
    item.macroHint = classifyMacroGroup(item);
  }

  return selected;
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(budget, servings, targetCalories, recipeQuery, mealType, timeConstraint, availableItems) {
  const queryLine = recipeQuery
    ? `User request for this run: ${recipeQuery}. Make the dish clearly match this request.`
    : "User request for this run: Any. Choose any style or ingredient focus.";

  const mealLine =
    mealType === "Any"
      ? "Meal type for this run: Any. Choose any meal type."
      : `Meal type for this run: ${mealType}. Make the dish clearly fit this meal type.`;

  const timeLine =
    timeConstraint === "Any"
      ? "Time constraint for this run: Any. Choose any duration."
      : `Time constraint for this run: ${timeConstraint}. Make the dish achievable within this time.`;

  return `
You are an expert nutritionist helping families in a cost-of-living crisis.
Task: Create a recipe that feeds ${servings} people.
Make sure to factor in serving sizes for the ingredients.
${queryLine}
${mealLine}
${timeLine}

Constraints:
1. BUDGET: Aim to keep the combined cost under $${budget.toFixed(2)}, but exceeding is allowed.
2. CALORIES: Aim for approximately ${targetCalories} calories per serving and include it in the markdown.
3. INGREDIENTS: You may ONLY use items from the "Available Items" list below. Do not invent ingredients.
4. BALANCE: Use a mix of categories; macroHint is a rough guide for protein/carb/veg.
5. ACCURACY: Use only ids from the list. Do not return name, price, or store fields in the ingredient list.
6. QTY: qty must be a positive whole number.
7. All items in the recipe MUST BE FROM THE AVAILABLE ITEMS LIST.
8. The recipe markdown must explicitly mention each chosen ingredient term or name.

Available Items (JSON array):
${JSON.stringify(availableItems)}

You must return a valid JSON object strictly matching this format:
{
  "ingredientIds": [
    {
      "id": "must_be_exact_id_from_list",
      "qty": 1
    }
  ],
  "recipeMarkdown": "Use markdown with a title, ingredient list, and steps.",
  "totalPrice": 0.0
}
`;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateRecipe(recipe, availableItems, budget, allowOverBudget = false) {
  const requiredKeys = ["ingredientIds", "recipeMarkdown", "totalPrice"];
  for (const key of requiredKeys) {
    if (!(key in recipe)) throw new Error(`Recipe is missing keys: ${key}`);
  }

  if (!Array.isArray(recipe.ingredientIds) || recipe.ingredientIds.length === 0) {
    throw new Error("ingredientIds must be a non-empty list.");
  }
  if (typeof recipe.recipeMarkdown !== "string" || !recipe.recipeMarkdown.trim()) {
    throw new Error("recipeMarkdown must be a non-empty string.");
  }
  if (typeof recipe.totalPrice !== "number") {
    throw new Error("totalPrice must be a number.");
  }

  const availableById = Object.fromEntries(availableItems.map((item) => [item.id, item]));
  let totalCost = 0;
  const ingredientMap = new Map();

  for (const item of recipe.ingredientIds) {
    if (typeof item !== "object" || item === null) {
      throw new Error("Each ingredient must be an object.");
    }
    if (!("id" in item)) throw new Error("Ingredient is missing id.");
    if (!("qty" in item)) throw new Error("Ingredient is missing qty.");

    const ingredientId = item.id;
    if (!(ingredientId in availableById)) {
      throw new Error(`Ingredient id not in available list: ${ingredientId}`);
    }

    const qtyRaw = item.qty;
    if (typeof qtyRaw === "boolean") throw new Error(`Invalid qty for ${ingredientId}: ${qtyRaw}`);
    if (typeof qtyRaw === "number" && !Number.isInteger(qtyRaw)) {
      throw new Error(`Invalid qty for ${ingredientId}: ${qtyRaw}`);
    }
    const qty = parseInt(qtyRaw, 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error(`Qty must be positive for ${ingredientId}.`);
    }

    const source = availableById[ingredientId];
    totalCost += source.price * qty;
    const existing = ingredientMap.get(source.id);
    if (existing) {
      existing.qty += qty;
    } else {
      ingredientMap.set(source.id, { id: source.id, qty, unitPrice: source.price });
    }
  }

  const cleanedIngredients = Array.from(ingredientMap.values());
  validateMarkdownIngredients(recipe.recipeMarkdown, cleanedIngredients, availableById);

  const overBudget = totalCost - budget;
  if (overBudget > BUDGET_TOLERANCE && !allowOverBudget) {
    throw new Error(`Budget exceeded. Total $${totalCost.toFixed(2)} over $${budget.toFixed(2)}.`);
  }

  return [
    {
      ingredientIds: cleanedIngredients,
      recipeMarkdown: recipe.recipeMarkdown.trim(),
      totalPrice: totalCost,
    },
    totalCost,
  ];
}

function validateMarkdownIngredients(markdown, ingredients, availableById) {
  const normalisedMarkdown = normaliseText(markdown);
  if (!normalisedMarkdown) {
    throw new Error("recipeMarkdown must be a non-empty string.");
  }

  for (const ingredient of ingredients) {
    const source = availableById[ingredient.id];
    const termTokens = extractQueryTokens(source.term || source.name);
    if (termTokens.length === 0) continue;

    const hasToken = termTokens.some((token) => keywordInText(normalisedMarkdown, token));
    if (!hasToken) {
      throw new Error(`recipeMarkdown must mention ingredient term: ${source.term || source.name}`);
    }
  }
}

// ─── Budget Adjustment ────────────────────────────────────────────────────────

function candidateReplacements(baseItem, availableItems) {
  const baseId = baseItem.id;
  const basePrice = baseItem.price;
  const baseTerm = baseItem.term || "";
  const baseCategory = categoryKey(baseItem);
  const macroHint = baseItem.macroHint || classifyMacroGroup(baseItem);

  const buckets = [[], [], []];
  for (const item of availableItems) {
    if (item.id === baseId) continue;
    if (item.price >= basePrice) continue;

    if (baseTerm && item.term === baseTerm) { buckets[0].push(item); continue; }
    if (item.category && categoryKey(item) === baseCategory) { buckets[1].push(item); continue; }
    if ((item.macroHint || classifyMacroGroup(item)) === macroHint) buckets[2].push(item);
  }

  const seenIds = new Set();
  const candidates = [];
  for (const bucket of buckets) {
    const sorted = [...bucket].sort((a, b) => a.price - b.price);
    for (const item of sorted) {
      if (seenIds.has(item.id)) continue;
      seenIds.add(item.id);
      candidates.push(item);
    }
  }
  return candidates;
}

function adjustRecipeToBudget(recipe, availableItems, budget) {
  const availableById = Object.fromEntries(availableItems.map((item) => [item.id, item]));
  const ingredients = recipe.ingredientIds.map((item) => {
    if (!(item.id in availableById)) {
      throw new Error(`Ingredient id not in available list: ${item.id}`);
    }
    const qty = parseInt(item.qty, 10);
    if (qty <= 0) throw new Error(`Qty must be positive for ${item.id}.`);
    return { id: item.id, qty };
  });

  const totalCost = () =>
    ingredients.reduce(
      (sum, ing) => sum + availableById[ing.id].price * ing.qty,
      0
    );

  let current = totalCost();
  if (current <= budget) {
    recipe.ingredientIds = ingredients;
    return recipe;
  }

  // Swap for cheaper items
  const replacementOptions = [];
  for (let i = 0; i < ingredients.length; i++) {
    const baseItem = availableById[ingredients[i].id];
    const candidates = candidateReplacements(baseItem, availableItems);
    if (candidates.length === 0) continue;
    const best = candidates[0];
    const savings = (baseItem.price - best.price) * ingredients[i].qty;
    if (savings > 0) replacementOptions.push([savings, i, best.id]);
  }
  replacementOptions.sort((a, b) => b[0] - a[0]);

  for (const [, idx, replacementId] of replacementOptions) {
    if (current <= budget) break;
    const currentId = ingredients[idx].id;
    const currentPrice = availableById[currentId].price;
    const replacementPrice = availableById[replacementId].price;
    if (replacementPrice >= currentPrice) continue;
    ingredients[idx].id = replacementId;
    current -= (currentPrice - replacementPrice) * ingredients[idx].qty;
  }

  // Reduce quantities
  if (current > budget) {
    while (current > budget) {
      const reducible = ingredients
        .map((ing, i) => [availableById[ing.id].price, i])
        .filter(([, i]) => ingredients[i].qty > 1)
        .sort((a, b) => b[0] - a[0]);
      if (reducible.length === 0) break;
      const [unitPrice, idx] = reducible[0];
      ingredients[idx].qty -= 1;
      current -= unitPrice;
    }
  }

  if (current - budget > BUDGET_TOLERANCE) {
    throw new Error(
      `Budget exceeded. Total $${current.toFixed(2)} over $${budget.toFixed(2)} after adjustments.`
    );
  }

  recipe.ingredientIds = ingredients;
  return recipe;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  const requestId = Math.random().toString(36).slice(2, 8).toUpperCase();
  const log = (msg) => console.log(`[recipe:${requestId}] ${msg}`);

  try {
    const body = await parseJsonBody(req);

    const budget = requirePositiveNumber(body?.budget, "budget");
    const servings = requirePositiveNumber(body?.servings, "servings");
    const targetCalories = typeof body?.targetCalories === "number"
      ? requirePositiveNumber(body.targetCalories, "targetCalories")
      : 500;

    const recipeQuery = resolveRecipeQuery(body?.cuisineStyle);
    const mealType = resolveMealType(body?.mealType);
    const timeConstraint = resolveTimeConstraint(body?.duration);

    log(`Firing up AI Chef — budget=$${budget} servings=${servings} cal=${targetCalories}`);
    log(`Query: ${recipeQuery ?? "Any"} | Meal: ${mealType} | Time: ${timeConstraint}`);

    const openai = getOpenAIClient();

    // Build semantic query for KNN search
    const semanticParts = [];
    if (recipeQuery) semanticParts.push(recipeQuery);
    if (mealType !== "Any") semanticParts.push(mealType);
    const semanticQuery = semanticParts.length > 0
      ? semanticParts.join(" ") + " meal"
      : null;

    log(`Semantic query: ${semanticQuery ?? "(none — using price range)"}`);

    // Fetch affordable items
    log("Querying Elasticsearch...");
    let affordableItems = await fetchAffordableItems(budget, semanticQuery, openai);
    log(`Elasticsearch returned ${affordableItems.length} items`);

    // Fall back to range query if semantic results are sparse
    if (semanticQuery && affordableItems.length < MIN_SEMANTIC_RESULTS) {
      log(`Sparse semantic results (${affordableItems.length} < ${MIN_SEMANTIC_RESULTS}), fetching fallback range query...`);
      const fallbackItems = await fetchAffordableItems(budget, null, openai);
      const seenIds = new Set(affordableItems.map((i) => i.id));
      for (const item of fallbackItems) {
        if (!seenIds.has(item.id)) {
          affordableItems.push(item);
          seenIds.add(item.id);
        }
      }
      log(`After fallback merge: ${affordableItems.length} items`);
    }

    if (recipeQuery) {
      const filteredItems = filterItemsByQuery(affordableItems, recipeQuery);
      if (filteredItems.length >= MIN_QUERY_RESULTS) {
        affordableItems = filteredItems;
        log(`Filtered by query "${recipeQuery}" to ${affordableItems.length} items`);
      } else {
        log(`Query filter too narrow (${filteredItems.length} items). Keeping full list.`);
      }
    }

    const availableIngredients = selectItems(affordableItems);

    const macroCounts = { protein: 0, carb: 0, veg: 0, other: 0 };
    for (const item of availableIngredients) {
      macroCounts[item.macroHint] = (macroCounts[item.macroHint] || 0) + 1;
    }
    log(`Selected ${availableIngredients.length} items for prompt (from ${affordableItems.length} affordable)`);
    log(`Macro hints: protein=${macroCounts.protein} carb=${macroCounts.carb} veg=${macroCounts.veg} other=${macroCounts.other}`);

    // Build prompt
    let prompt = buildPrompt(
      budget,
      servings,
      targetCalories,
      recipeQuery,
      mealType,
      timeConstraint,
      availableIngredients
    );

    let recipe;
    let totalCost;
    let lastError;

    for (let attempt = 1; attempt <= MAX_LLM_ATTEMPTS; attempt++) {
      log(`LLM attempt ${attempt}/${MAX_LLM_ATTEMPTS} — calling gpt-4o-mini...`);
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: MODEL_TEMPERATURE,
        top_p: MODEL_TOP_P,
      });

      const rawJson = completion.choices[0].message.content;
      const parsed = JSON.parse(rawJson);
      log(`LLM responded with ${parsed.ingredientIds?.length ?? "?"} ingredients, totalPrice=$${parsed.totalPrice}`);

      try {
        [recipe, totalCost] = validateRecipe(parsed, availableIngredients, budget, true);
        log(`Validation passed — total cost $${totalCost.toFixed(2)}`);

        if (totalCost > budget) {
          log(`Over budget by $${(totalCost - budget).toFixed(2)}, adjusting...`);
          recipe = adjustRecipeToBudget(recipe, availableIngredients, budget);
          [recipe, totalCost] = validateRecipe(recipe, availableIngredients, budget, false);
          log(`Adjusted total: $${totalCost.toFixed(2)}`);
        }
        break;
      } catch (exc) {
        lastError = exc;
        const isBudgetError =
          exc instanceof Error && exc.message.startsWith("Budget exceeded.");

        log(`Attempt ${attempt} failed: ${exc.message}`);

        if (attempt === MAX_LLM_ATTEMPTS && isBudgetError) {
          log("Final attempt — accepting over-budget result.");
          [recipe, totalCost] = validateRecipe(parsed, availableIngredients, budget, true);
          break;
        }
        if (attempt === MAX_LLM_ATTEMPTS) throw exc;

        const retryNote = isBudgetError
          ? "The previous response exceeded the budget. Reduce total cost by selecting cheaper items and smaller quantities. Use as few ingredients as possible while staying within budget."
          : "The previous response failed validation.";

        prompt =
          buildPrompt(budget, servings, targetCalories, recipeQuery, mealType, timeConstraint, availableIngredients) +
          `\n${retryNote}\nValidation error: ${exc.message}\nReturn a corrected JSON response using ONLY ids from the list.\n`;
      }
    }

    if (!recipe) {
      throw new Error(`Failed to generate a valid recipe: ${lastError?.message}`);
    }

    log(`Recipe generated successfully — $${totalCost.toFixed(2)} for ${recipe.ingredientIds.length} ingredients`);

    // Resolve ingredient names for the response
    const availableById = Object.fromEntries(availableIngredients.map((i) => [i.id, i]));
    const ingredients = recipe.ingredientIds.map((ing) => {
      const source = availableById[ing.id];
      return {
        id: ing.id,
        name: source.name,
        qty: ing.qty,
        unitPrice: ing.unitPrice ?? source.price,
        store: source.store,
        totalPrice: (ing.unitPrice ?? source.price) * ing.qty,
      };
    });

    res.status(200).json({
      recipeMarkdown: recipe.recipeMarkdown,
      ingredients,
      totalPrice: recipe.totalPrice,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    console.error(`[recipe:${requestId}] ERROR: ${details}`);
    res.status(500).json({
      error: "Failed to generate recipe.",
      details,
    });
  }
}
