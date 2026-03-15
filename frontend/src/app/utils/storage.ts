import { SavedRecipe, ShoppingList } from '../data/types';

const LISTS_KEY = 'budgetbunny_shopping_lists';
const RECIPES_KEY = 'budgetbunny_saved_recipes';

type StoredList = Omit<ShoppingList, 'createdAt'> & { createdAt: string | Date };
type StoredRecipe = Omit<SavedRecipe, 'createdAt'> & { createdAt: string | Date };

export const getSavedLists = (): ShoppingList[] => {
  const lists = readStorage<StoredList>(LISTS_KEY);
  return lists.map((list) => ({
    ...list,
    createdAt: toDate(list.createdAt, 'list createdAt'),
  }));
};

export const getSavedRecipes = (): SavedRecipe[] => {
  const recipes = readStorage<StoredRecipe>(RECIPES_KEY);
  return recipes.map((recipe) => ({
    ...recipe,
    createdAt: toDate(recipe.createdAt, 'recipe createdAt'),
  }));
};

export const saveList = (list: ShoppingList): void => {
  assertValidDate(list.createdAt, 'list createdAt');
  const lists = getSavedLists();
  const existingIndex = lists.findIndex((l) => l.id === list.id);
  const nextLists = [...lists];

  if (existingIndex >= 0) {
    nextLists[existingIndex] = list;
  } else {
    nextLists.push(list);
  }

  writeStorage(LISTS_KEY, nextLists);
};

export const saveRecipe = (recipe: SavedRecipe): void => {
  assertValidDate(recipe.createdAt, 'recipe createdAt');
  const recipes = getSavedRecipes();
  const existingIndex = recipes.findIndex((r) => r.id === recipe.id);
  const nextRecipes = [...recipes];

  if (existingIndex >= 0) {
    nextRecipes[existingIndex] = recipe;
  } else {
    nextRecipes.push(recipe);
  }

  writeStorage(RECIPES_KEY, nextRecipes);
};

export const deleteList = (id: string): void => {
  const lists = getSavedLists();
  const filtered = lists.filter((list) => list.id !== id);
  writeStorage(LISTS_KEY, filtered);
};

export const deleteRecipe = (id: string): void => {
  const recipes = getSavedRecipes();
  const filtered = recipes.filter((recipe) => recipe.id !== id);
  writeStorage(RECIPES_KEY, filtered);
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

function ensureStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error('localStorage is not available.');
  }
  return window.localStorage;
}

function readStorage<T>(key: string): T[] {
  const storage = ensureStorage();
  const saved = storage.getItem(key);
  if (!saved) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(saved);
  } catch {
    throw new Error(`Failed to parse ${key} from localStorage.`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Invalid data for ${key}. Expected an array.`);
  }

  return parsed as T[];
}

function writeStorage<T>(key: string, value: T[]): void {
  const storage = ensureStorage();
  storage.setItem(key, JSON.stringify(value));
}

function toDate(value: string | Date, label: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${label} date.`);
  }
  return date;
}

function assertValidDate(value: Date, label: string): void {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new Error(`Invalid ${label} date.`);
  }
}