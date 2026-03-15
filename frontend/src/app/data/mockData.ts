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

export interface ShoppingList {
  id: string;
  name: string;
  items: string[];
  createdAt: Date;
  budget?: number;
}

export const stores: Store[] = [
  { id: 'aldi', name: 'Aldi', type: 'supermarket', location: 'North' },
  { id: 'coles', name: 'Coles', type: 'supermarket', location: 'Central' },
  { id: 'woolworths', name: 'Woolworths', type: 'supermarket', location: 'South' },
  { id: 'iga', name: 'IGA', type: 'supermarket', location: 'East' },
  { id: 'pantry1', name: 'Community Food Pantry', type: 'pantry', location: 'West' },
];

export const products: ProductWithPrices[] = [
  {
    id: 'apple',
    name: 'Apples',
    category: 'Fruit',
    unit: '1 kg bag',
    prices: [
      { storeId: 'aldi', storeName: 'Aldi', price: 3.49, onSale: false },
      { storeId: 'coles', storeName: 'Coles', price: 3.99, onSale: true, salePrice: 3.2, weeklySpecial: true },
      { storeId: 'woolworths', storeName: 'Woolworths', price: 4.1, onSale: false },
      { storeId: 'iga', storeName: 'IGA', price: 4.29, onSale: false },
    ],
  },
  {
    id: 'banana',
    name: 'Bananas',
    category: 'Fruit',
    unit: '1 kg',
    prices: [
      { storeId: 'aldi', storeName: 'Aldi', price: 2.99, onSale: false },
      { storeId: 'coles', storeName: 'Coles', price: 3.2, onSale: false },
      { storeId: 'woolworths', storeName: 'Woolworths', price: 3.35, onSale: false },
      { storeId: 'iga', storeName: 'IGA', price: 3.49, onSale: true, salePrice: 3.19, weeklySpecial: true },
    ],
  },
  {
    id: 'milk',
    name: 'Milk',
    category: 'Dairy',
    unit: '2 L bottle',
    prices: [
      { storeId: 'aldi', storeName: 'Aldi', price: 3.29, onSale: false },
      { storeId: 'coles', storeName: 'Coles', price: 3.6, onSale: true, salePrice: 3.3, weeklySpecial: true },
      { storeId: 'woolworths', storeName: 'Woolworths', price: 3.59, onSale: false },
      { storeId: 'iga', storeName: 'IGA', price: 3.79, onSale: false },
    ],
  },
  {
    id: 'bread',
    name: 'Wholegrain Bread',
    category: 'Bakery',
    unit: '700 g loaf',
    prices: [
      { storeId: 'aldi', storeName: 'Aldi', price: 2.59, onSale: false },
      { storeId: 'coles', storeName: 'Coles', price: 2.89, onSale: false },
      { storeId: 'woolworths', storeName: 'Woolworths', price: 2.99, onSale: true, salePrice: 2.5, weeklySpecial: true },
      { storeId: 'iga', storeName: 'IGA', price: 3.19, onSale: false },
    ],
  },
];
