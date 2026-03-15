import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { WeeklySpecials } from './pages/WeeklySpecials';
import { SavedLists } from './pages/SavedLists';
import { Recipes } from './pages/Recipes';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'specials', Component: WeeklySpecials },
      { path: 'saved', Component: SavedLists },
      { path: 'recipes', Component: Recipes },
    ],
  },
]);
