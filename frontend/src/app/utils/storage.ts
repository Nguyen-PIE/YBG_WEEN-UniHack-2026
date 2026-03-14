import { ShoppingList } from '../data/mockData';

const STORAGE_KEY = 'budgetbunny_shopping_lists';

export const getSavedLists = (): ShoppingList[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const lists = JSON.parse(saved);
    // Convert date strings back to Date objects
    return lists.map((list: ShoppingList) => ({
      ...list,
      createdAt: new Date(list.createdAt),
    }));
  } catch (error) {
    console.error('Error loading saved lists:', error);
    return [];
  }
};

export const saveList = (list: ShoppingList): void => {
  try {
    const lists = getSavedLists();
    const existingIndex = lists.findIndex((l) => l.id === list.id);
    
    if (existingIndex >= 0) {
      lists[existingIndex] = list;
    } else {
      lists.push(list);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch (error) {
    console.error('Error saving list:', error);
  }
};

export const deleteList = (id: string): void => {
  try {
    const lists = getSavedLists();
    const filtered = lists.filter((list) => list.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting list:', error);
  }
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};