import { Link, Outlet, useLocation } from 'react-router';
import { ShoppingCart, Tag, ListChecks, ChefHat } from 'lucide-react';
export const BUNNY_LOGO = "https://storage.googleapis.com/budget-bunny-assets/bunny.png";

export function Layout() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Search', icon: ShoppingCart },
    { path: '/specials', label: 'Price Comparison', icon: Tag },
    { path: '/recipes', label: 'Recipes', icon: ChefHat },
    { path: '/saved', label: 'Saved Lists', icon: ListChecks },
  ];
  
  return (
    // Updated background to the njCream from your theme.css
    <div className="min-h-screen bg-[#FCFCFA] text-foreground font-sans">
      {/* Header with thick Denim Blue bottom border */}
      <header className="bg-white border-b-4 border-primary sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:scale-105 transition-transform">
              <img 
                src={BUNNY_LOGO}
                alt="Budget Bunny Mascot"
                className="size-28 object-contain drop-shadow-[2px_2px_0px_rgba(93,130,193,1)]"
              />
              <div className="hidden xs:block">
                <h1 className="text-3xl font-black text-primary tracking-tighter italic uppercase">
                  Budget <span className="text-secondary">Bunny</span>
                </h1>
                <p className="text-[10px] text-primary/60 font-black uppercase tracking-[0.3em]">
                  Hop to Savings!
                </p>
              </div>
            </Link>
            
            <nav className="flex items-center gap-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all font-black uppercase text-xs tracking-tight border-2 ${
                      isActive
                        ? 'bg-secondary border-primary text-foreground shadow-[3px_3px_0px_0px_#5D82C1] -translate-y-0.5'
                        : 'border-transparent text-primary/60 hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    <Icon className="size-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Outlet />
      </main>

      {/* Optional: Subtle footer for extra "Bunny" vibes */}
      <footer className="py-10 text-center opacity-20 select-none pointer-events-none">
        <p className="text-primary font-black uppercase tracking-[1em]">BudgetBunny</p>
      </footer>
    </div>
  );
}