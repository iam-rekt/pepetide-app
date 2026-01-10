'use client';

import { Home, Calculator, Calendar, Clock, Users, Sparkles, List, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ViewMode } from '@/types';

interface NavigationProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  const navItems = [
    { id: 'dashboard' as ViewMode, label: 'Home', icon: Home },
    { id: 'add-stack' as ViewMode, label: 'Add', icon: Sparkles, highlight: true },
    { id: 'my-list' as ViewMode, label: 'List', icon: List },
    { id: 'protocol' as ViewMode, label: 'Protocol', icon: Clock },
    { id: 'calculator' as ViewMode, label: 'Calc', icon: Calculator },
    { id: 'calendar' as ViewMode, label: 'Calendar', icon: Calendar },
    { id: 'community' as ViewMode, label: 'Community', icon: Users },
    { id: 'settings' as ViewMode, label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Navigation - Hidden on mobile */}
      <nav className="hidden md:flex gap-2 flex-wrap">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isHighlight = 'highlight' in item && item.highlight;

          return (
            <Button
              key={item.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewChange(item.id)}
              className={`flex items-center gap-2 backdrop-blur-md ${isActive
                ? 'bg-slate-900/90 dark:bg-white/90 border-slate-700 dark:border-slate-300'
                : 'bg-white/70 dark:bg-slate-900/70 border-slate-300 dark:border-slate-700'
                } ${isHighlight && !isActive
                  ? 'border-cyan-300 dark:border-cyan-700 hover:bg-white/80 dark:hover:bg-slate-900/80'
                  : ''
                } ${isActive && isHighlight
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/30 border-cyan-400'
                  : ''
                }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Button>
          );
        })}
      </nav>

      {/* Mobile Bottom Navigation - Fixed at bottom with ALL buttons */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-700 pb-safe">
        <div className="flex justify-between items-center h-16 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const isHighlight = 'highlight' in item && item.highlight;

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg min-w-[44px] flex-1 transition-all ${isActive
                  ? isHighlight
                    ? 'text-white bg-gradient-to-r from-cyan-500 to-blue-600'
                    : 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50'
                  : isHighlight
                    ? 'text-cyan-600 dark:text-cyan-400'
                    : 'text-slate-500 dark:text-slate-400'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className={`text-[9px] mt-0.5 font-medium truncate max-w-full ${isActive ? 'opacity-100' : 'opacity-70'
                  }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
