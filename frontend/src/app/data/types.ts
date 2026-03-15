// Shared data types – all product data is loaded live from Elasticsearch.

export interface StorePrice {
  storeId: string;
  storeName: string;
  price: number;
  onSale: boolean;
  salePrice?: number;
  weeklySpecial?: boolean;
  image?: string;
  url?: string;
}

export interface ProductWithPrices {
  id: string;
  name: string;
  category: string;
  unit: string; // may be empty string when not present in the source document
  prices: StorePrice[];
}

export interface SavedItem {
  id: string;
  name: string;
  unit?: string;
  price: number;
  store: string;
  qty?: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: SavedItem[];
  createdAt: Date;
  budget?: number;
}

export interface SavedRecipeIngredient {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  store: string;
  totalPrice: number;
}

export interface SavedRecipe {
  id: string;
  name: string;
  recipeMarkdown: string;
  ingredients: SavedRecipeIngredient[];
  totalPrice: number;
  createdAt: Date;
}
