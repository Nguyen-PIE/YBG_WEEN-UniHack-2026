import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { PriceComparison } from './components/PriceComparison';
import { SavedLists } from './pages/SavedLists';
import { Recipes } from './pages/Recipes';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'specials', Component: PriceComparison },
      { path: 'saved', Component: SavedLists },
      { path: 'recipes', Component: Recipes },
    ],
  },
]);
