export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  calories?: number;
  servings?: number;
}

export interface StorePrice {
  storeId: string;
  storeName: string;
  price: number;
  onSale: boolean;
  salePrice?: number;
  weeklySpecial?: boolean;
}

export interface ProductWithPrices extends Product {
  prices: StorePrice[];
}

export interface Store {
  id: string;
  name: string;
  type: 'supermarket' | 'pantry';
  location: string;
}

export const stores: Store[] = [
  { id: 'walmart', name: 'Walmart', type: 'supermarket', location: 'Main St' },
  { id: 'target', name: 'Target', type: 'supermarket', location: 'Oak Ave' },
  { id: 'kroger', name: 'Kroger', type: 'supermarket', location: 'Elm St' },
  { id: 'aldi', name: 'ALDI', type: 'supermarket', location: 'Pine Rd' },
  { id: 'pantry1', name: 'Community Food Pantry', type: 'pantry', location: 'Church St' },
  { id: 'pantry2', name: 'Hope Kitchen', type: 'pantry', location: 'Highland Ave' },
];

export const products: ProductWithPrices[] = [
  {
    id: 'rice',
    name: 'White Rice',
    category: 'Grains',
    unit: '5 lb bag',
    calories: 2000,
    servings: 20,
    prices: [
      { storeId: 'walmart', storeName: 'Walmart', price: 4.99, onSale: false },
      { storeId: 'target', storeName: 'Target', price: 5.49, onSale: false },
      { storeId: 'kroger', storeName: 'Kroger', price: 5.99, onSale: true, salePrice: 4.49, weeklySpecial: true },
      { storeId: 'aldi', storeName: 'ALDI', price: 3.99, onSale: false },
    ],
  },
  {
    id: 'beans',
    name: 'Pinto Beans',
    category: 'Proteins',
    unit: '2 lb bag',
    calories: 1200,
    servings: 12,
    prices: [
      { storeId: 'walmart', storeName: 'Walmart', price: 2.49, onSale: false },
      { storeId: 'target', storeName: 'Target', price: 2.79, onSale: false },
      { storeId: 'kroger', storeName: 'Kroger', price: 2.99, onSale: false },
      { storeId: 'aldi', storeName: 'ALDI', price: 1.99, onSale: false },
    ],
  },
  {
    id: 'pasta',
    name: 'Spaghetti',
    category: 'Grains',
    unit: '1 lb box',
    calories: 1600,
    servings: 8,
    prices: [
      { storeId: 'walmart', storeName: 'Walmart', price: 1.29, onSale: true, salePrice: 0.99, weeklySpecial: true },
      { storeId: 'target', storeName: 'Target', price: 1.49, onSale: false },
      { storeId: 'kroger', storeName: 'Kroger', price: 1.39, onSale: false },
      { storeId: 'aldi', storeName: 'ALDI', price: 0.89, onSale: false },
    ],
  },
  {
    id: 'eggs',
    name: 'Large Eggs',
    category: 'Proteins',
    unit: '12 count',
    calories: 840,
    servings: 12,
    prices: [
      { storeId: 'walmart', storeName: 'Walmart', price: 3.99, onSale: false },
      { storeId: 'target', storeName: 'Target', price: 4.29, onSale: true, salePrice: 3.49, weeklySpecial: true },
      { storeId: 'kroger', storeName: 'Kroger', price: 4.49, onSale: false },
      { storeId: 'aldi', storeName: 'ALDI', price: 2.99, onSale: false },
    ],
  },
  {
    id: 'bread',
    name: 'Whole Wheat Bread',
    category: 'Grains',
    unit: '20 oz loaf',
    calories: 1400,
    servings: 20,
    prices: [
      { storeId: 'walmart', storeName: 'Walmart', price: 2.49, onSale: false },
      { storeId: 'target', storeName: 'Target', price: 2.79, onSale: false },
      { storeId: 'kroger', storeName: 'Kroger', price: 2.99, onSale: false },
      { storeId: 'aldi', storeName: 'ALDI', price: 1.79, onSale: false },
    ],
  },
  {
    id: 'milk',
    name: 'Whole Milk',
    category: 'Dairy',
    unit: '1 gallon',
    calories: 2400,
    servings: 16,
    prices: [
      { storeId: 'walmart', storeName: 'Walmart', price: 3.79, onSale: false },
      { storeId: 'target', storeName: 'Target', price: 3.99, onSale: false },
      { storeId: 'kroger', storeName: 'Kroger', price: 4.29, onSale: true, salePrice: 3.49, weeklySpecial: true },
      { storeId: 'aldi', storeName: 'ALDI', price: 3.29, onSale: false },
    ],
  },
  {
    id: 'chicken',
    name: 'Chicken Breast',
    category: 'Proteins',
    unit: '2 lb pack',
    calories: 1000,
    servings: 8,
    prices: [
      { storeId: 'walmart', storeName: 'Walmart', price: 7.99, onSale: true, salePrice: 6.99, weeklySpecial: true },
      { storeId: 'target', storeName: 'Target', price: 8.49, onSale: false },
      { storeId: 'kroger', storeName: 'Kroger', price: 8.99, onSale: false },
      { storeId: 'aldi', storeName: 'ALDI', price: 6.49, onSale: false },
    ],
  },
  {
    id: 'potatoes',
    name: 'Russet Potatoes',
    category: 'Vegetables',
    unit: '5 lb bag',
    calories: 1750,
    servings: 15,
    prices: [
      { storeId: 'walmart', storeName: 'Walmart', price: 3.49, onSale: false },
      { storeId: 'target', storeName: 'Target', price: 3.99, onSale: false },
      { storeId: 'kroger', storeName: 'Kroger', price: 4.29, onSale: false },
      { storeId: 'aldi', storeName: 'ALDI', price: 2.99, onSale: false },
    ],
  },
  {
    id: 'carrots',
    name: 'Baby Carrots',
    category: 'Vegetables',
    unit: '2 lb bag',
    calories: 300,
    servings: 10,
    prices: [
      { storeId: 'walmart', storeName: 'Walmart', price: 2.29, onSale: false },
      { storeId: 'target', storeName: 'Target', price: 2.49, onSale: true, salePrice: 1.99, weeklySpecial: true },
      { storeId: 'kroger', storeName: 'Kroger', price: 2.79, onSale: false },
      { storeId: 'aldi', storeName: 'ALDI', price: 1.79, onSale: false },
    ],
  },
  {
    id: 'cheese',
    name: 'Cheddar Cheese',
    category: 'Dairy',
    unit: '8 oz block',
    calories: 900,
    servings: 8,
    prices: [
      { storeId: 'walmart', storeName: 'Walmart', price: 3.99, onSale: false },
      { storeId: 'target', storeName: 'Target', price: 4.29, onSale: false },
      { storeId: 'kroger', storeName: 'Kroger', price: 4.49, onSale: false },
      { storeId: 'aldi', storeName: 'ALDI', price: 2.99, onSale: false },
    ],
  },
  {
    id: 'oatmeal',
    name: 'Rolled Oats',
    category: 'Grains',
    unit: '42 oz canister',
    calories: 4200,
    servings: 30,
    prices: [
      { storeId: 'walmart', storeName: 'Walmart', price: 4.49, onSale: false },
      { storeId: 'target', storeName: 'Target', price: 4.99, onSale: false },
      { storeId: 'kroger', storeName: 'Kroger', price: 5.29, onSale: true, salePrice: 3.99, weeklySpecial: true },
      { storeId: 'aldi', storeName: 'ALDI', price: 3.49, onSale: false },
    ],
  },
  {
    id: 'oil',
    name: 'Vegetable Oil',
    category: 'Cooking',
    unit: '48 oz bottle',
    calories: 12000,
    servings: 96,
    prices: [
      { storeId: 'walmart', storeName: 'Walmart', price: 5.99, onSale: false },
      { storeId: 'target', storeName: 'Target', price: 6.49, onSale: false },
      { storeId: 'kroger', storeName: 'Kroger', price: 6.99, onSale: false },
      { storeId: 'aldi', storeName: 'ALDI', price: 4.99, onSale: false },
    ],
  },
  {
    id: 'tomatoes',
    name: 'Canned Tomatoes',
    category: 'Vegetables',
    unit: '28 oz can',
    calories: 200,
    servings: 7,
    prices: [
      { storeId: 'walmart', storeName: 'Walmart', price: 1.49, onSale: false },
      { storeId: 'target', storeName: 'Target', price: 1.69, onSale: false },
      { storeId: 'kroger', storeName: 'Kroger', price: 1.79, onSale: true, salePrice: 1.29, weeklySpecial: true },
      { storeId: 'aldi', storeName: 'ALDI', price: 0.99, onSale: false },
    ],
  },
  {
    id: 'onions',
    name: 'Yellow Onions',
    category: 'Vegetables',
    unit: '3 lb bag',
    calories: 450,
    servings: 10,
    prices: [
      { storeId: 'walmart', storeName: 'Walmart', price: 2.49, onSale: false },
      { storeId: 'target', storeName: 'Target', price: 2.79, onSale: false },
      { storeId: 'kroger', storeName: 'Kroger', price: 2.99, onSale: false },
      { storeId: 'aldi', storeName: 'ALDI', price: 1.99, onSale: false },
    ],
  },
  {
    id: 'peanutbutter',
    name: 'Peanut Butter',
    category: 'Proteins',
    unit: '16 oz jar',
    calories: 2800,
    servings: 16,
    prices: [
      { storeId: 'walmart', storeName: 'Walmart', price: 3.49, onSale: true, salePrice: 2.99, weeklySpecial: true },
      { storeId: 'target', storeName: 'Target', price: 3.79, onSale: false },
      { storeId: 'kroger', storeName: 'Kroger', price: 3.99, onSale: false },
      { storeId: 'aldi', storeName: 'ALDI', price: 2.49, onSale: false },
    ],
  },
];

export interface ShoppingList {
  id: string;
  name: string;
  items: string[]; // Product IDs
  createdAt: Date;
  budget?: number;
}
