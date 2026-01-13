'use client';

import { useState } from 'react';
import { Home, Calculator, Calendar, Clock, Users, Sparkles, List, Settings, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ViewMode } from '@/types';

interface NavigationProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showCommunityMenu, setShowCommunityMenu] = useState(false);

  const navItems = [
    { id: 'dashboard' as ViewMode, label: 'Home', icon: Home },
    { id: 'add-stack' as ViewMode, label: 'Add', icon: Sparkles, highlight: true },
    { id: 'my-list' as ViewMode, label: 'List', icon: List },
    { id: 'protocol' as ViewMode, label: 'Protocol', icon: Clock },
    { id: 'calculator' as ViewMode, label: 'Calc', icon: Calculator },
    { id: 'calendar' as ViewMode, label: 'Calendar', icon: Calendar },
    { id: 'community' as ViewMode, label: 'Community', icon: Users },
    { id: 'sys' as ViewMode, label: 'SYS', icon: MessageSquare },
    { id: 'settings' as ViewMode, label: 'Settings', icon: Settings },
  ];

  // Mobile-only nav items (simplified)
  const mobileNavItems = [
    { id: 'dashboard' as ViewMode, label: 'Home', icon: Home },
    { id: 'add' as const, label: 'Add', icon: Plus, highlight: true, isMenu: true },
    { id: 'calculator' as ViewMode, label: 'Calc', icon: Calculator },
    { id: 'calendar' as ViewMode, label: 'Calendar', icon: Calendar },
    { id: 'community' as const, label: 'Community', icon: Users, isMenu: true },
    { id: 'settings' as ViewMode, label: 'Settings', icon: Settings },
  ];

  const handleMobileClick = (item: typeof mobileNavItems[number]) => {
    if (item.id === 'add') {
      setShowAddMenu(true);
      setShowCommunityMenu(false);
    } else if (item.id === 'community') {
      setShowCommunityMenu(true);
      setShowAddMenu(false);
    } else {
      onViewChange(item.id as ViewMode);
      setShowAddMenu(false);
      setShowCommunityMenu(false);
    }
  };

  const handleAddOption = (view: 'my-list' | 'protocol') => {
    onViewChange(view);
    setShowAddMenu(false);
  };

  const handleCommunityOption = (view: 'community' | 'sys') => {
    onViewChange(view);
    setShowCommunityMenu(false);
  };

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

      {/* Add Menu Dropdown - slides up from button */}
      {showAddMenu && (
        <>
          <div className="md:hidden fixed inset-0 z-50" onClick={() => setShowAddMenu(false)} />
          <div className="md:hidden fixed bottom-[5rem] left-[16.666%] z-50 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleAddOption('protocol')}
                className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Clock className="w-6 h-6" />
                <span className="text-[9px] mt-0.5 font-medium">Protocol</span>
              </button>
              <button
                onClick={() => handleAddOption('my-list')}
                className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <List className="w-6 h-6" />
                <span className="text-[9px] mt-0.5 font-medium">List</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Community Menu Dropdown - slides up from button */}
      {showCommunityMenu && (
        <>
          <div className="md:hidden fixed inset-0 z-50" onClick={() => setShowCommunityMenu(false)} />
          <div className="md:hidden fixed bottom-[5rem] right-[16.666%] z-50 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleCommunityOption('sys')}
                className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <MessageSquare className="w-6 h-6" />
                <span className="text-[9px] mt-0.5 font-medium">SYS</span>
              </button>
              <button
                onClick={() => handleCommunityOption('community')}
                className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Users className="w-6 h-6" />
                <span className="text-[9px] mt-0.5 font-medium">Stacks</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Mobile Bottom Navigation - Simplified with dropdowns */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-700 pb-safe">
        <div className="flex justify-between items-center h-16 px-1">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isMenu
              ? item.id === 'add'
                ? (currentView === 'my-list' || currentView === 'protocol' || currentView === 'add-stack')
                : (currentView === 'community' || currentView === 'sys')
              : currentView === item.id;
            const isHighlight = 'highlight' in item && item.highlight;

            return (
              <button
                key={item.id}
                onClick={() => handleMobileClick(item)}
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
