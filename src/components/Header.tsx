import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { 
  BookOpen, 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  BarChart3, 
  Target, 
  Database,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewEntry: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewEntry,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'entry', label: 'Saisie (2 chiffres / jour)', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'history', label: 'Historique', icon: <History className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analyses & Graphiques', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'goals', label: 'Objectifs', icon: <Target className="w-4 h-4" /> },
    { id: 'backup', label: 'Sauvegardes & GitHub', icon: <Database className="w-4 h-4" /> },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className="text-left group cursor-pointer focus:outline-hidden"
            >
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">
                KDP Business Tracker
              </span>
              <span className="hidden sm:block text-[11px] font-medium text-slate-500 tracking-normal -mt-1">
                Suivi Chiffre d'Affaires & Amazon Ads
              </span>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-blue-700 bg-blue-50/80 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action & Quick Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Main Action Button */}
            <button
              onClick={() => {
                onOpenNewEntry();
                setActiveTab('entry');
              }}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs hover:shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Saisir / Actualiser</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Menu principal"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg text-left transition-colors ${
                  isActive
                    ? 'text-blue-700 bg-blue-50 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
