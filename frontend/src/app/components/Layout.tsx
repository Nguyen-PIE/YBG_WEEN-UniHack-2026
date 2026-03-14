import { Link, Outlet, useLocation } from 'react-router';
import { ShoppingCart, Tag, ListChecks } from 'lucide-react';

export function Layout() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Search', icon: ShoppingCart },
    { path: '/specials', label: 'Weekly Specials', icon: Tag },
    { path: '/saved', label: 'Saved Lists', icon: ListChecks },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <header className="bg-white shadow-md border-b-4 border-pink-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img 
                src={"assets/bunny.png"}
                alt="Budget Bunny Mascot"
                className="size-16"
              />
              <div>
                <h1 className="text-3xl font-black  from-pink-600 to-purple-600 bg-clip-text text-transparent">Budget Bunny</h1>
                <p className="text-sm text-gray-600 font-medium">Hop to savings!</p>
              </div>
            </Link>
            
            <nav className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all font-semibold ${
                      isActive
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105'
                        : 'text-gray-700 hover:bg-purple-100'
                    }`}
                  >
                    <Icon className="size-5" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}