import { Link, Outlet, useLocation } from 'react-router';
import { ShoppingCart, Tag, ListChecks } from 'lucide-react';
import bunnyLogo from '../assets/bunny.png';

export function Layout() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Search', icon: ShoppingCart },
    { path: '/specials', label: 'Weekly Specials', icon: Tag },
    { path: '/saved', label: 'Saved Lists', icon: ListChecks },
  ];
  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white shadow-sm border-b-4 border-pink-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img 
                src={bunnyLogo}
                alt="Budget Bunny Mascot"
                className="size-16 object-contain"
              />
              <div>
                <h1 className="text-3xl font-black text-pink-600 tracking-tight">
                  Budget Bunny
                </h1>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">
                  Hop to Savings!
                </p>
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold ${
                      isActive
                        ? 'bg-pink-600 text-white shadow-md transform -translate-y-0.5'
                        : 'text-slate-600 hover:bg-pink-50 hover:text-pink-600'
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