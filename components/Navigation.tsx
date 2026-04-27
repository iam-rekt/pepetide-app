'use client';

import { useState } from 'react';
import {
  HomeIcon,
  PlusVialIcon,
  VialIcon,
  ScrollIcon,
  BeakerIcon,
  CalendarIcon,
  ChatIcon,
  MoleculeIcon,
  GearIcon,
  TrendIcon,
} from '@/components/icons';
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
    { id: 'dashboard' as ViewMode, label: 'Home', icon: HomeIcon },
    { id: 'add-stack' as ViewMode, label: 'Add', icon: PlusVialIcon, highlight: true },
    { id: 'my-list' as ViewMode, label: 'List', icon: VialIcon },
    { id: 'protocol' as ViewMode, label: 'Protocol', icon: ScrollIcon },
    { id: 'calculator' as ViewMode, label: 'Calc', icon: BeakerIcon },
    { id: 'calendar' as ViewMode, label: 'Calendar', icon: CalendarIcon },
    { id: 'sys' as ViewMode, label: 'Threads', icon: ChatIcon },
    { id: 'community' as ViewMode, label: 'Peptides', icon: MoleculeIcon },
    { id: 'governance' as ViewMode, label: 'DAO', icon: TrendIcon },
    { id: 'settings' as ViewMode, label: 'Settings', icon: GearIcon },
  ];

  // Mobile-only nav items (simplified)
  const mobileNavItems = [
    { id: 'dashboard' as ViewMode, label: 'Home', icon: HomeIcon },
    { id: 'add' as const, label: 'Add', icon: PlusVialIcon, highlight: true, isMenu: true },
    { id: 'calculator' as ViewMode, label: 'Calc', icon: BeakerIcon },
    { id: 'calendar' as ViewMode, label: 'Calendar', icon: CalendarIcon },
    { id: 'threads' as const, label: 'Threads', icon: ChatIcon, isMenu: true },
    { id: 'settings' as ViewMode, label: 'Settings', icon: GearIcon },
  ];

  const handleMobileClick = (item: typeof mobileNavItems[number]) => {
    if (item.id === 'add') {
      setShowAddMenu(true);
      setShowCommunityMenu(false);
    } else if (item.id === 'threads') {
      setShowCommunityMenu(true);
      setShowAddMenu(false);
    } else {
      onViewChange(item.id as ViewMode);
      setShowAddMenu(false);
      setShowCommunityMenu(false);
    }
  };

  const handleAddOption = (view: 'add-stack' | 'my-list' | 'protocol') => {
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
              className={`flex items-center gap-2 backdrop-blur-md transition-all ${isActive
                ? 'bg-gradient-to-r from-emerald-500 to-lime-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-lime-600'
                : 'bg-white/70 dark:bg-slate-900/70 border-slate-300 dark:border-slate-700'
                } ${isHighlight && !isActive
                  ? 'border-emerald-300 dark:border-emerald-700 hover:bg-white/80 dark:hover:bg-slate-900/80'
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
                onClick={() => handleAddOption('add-stack')}
                className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow-lg shadow-emerald-500/40 ring-1 ring-white/30 hover:shadow-xl transition-all hover:scale-105"
              >
                <PlusVialIcon className="w-6 h-6" />
                <span className="text-[9px] mt-0.5 font-medium">Stack</span>
              </button>
              <button
                onClick={() => handleAddOption('protocol')}
                className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-white/20 hover:shadow-xl transition-all hover:scale-105"
              >
                <ScrollIcon className="w-6 h-6" />
                <span className="text-[9px] mt-0.5 font-medium">Protocol</span>
              </button>
              <button
                onClick={() => handleAddOption('my-list')}
                className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-lime-600 to-emerald-700 text-white shadow-lg shadow-lime-600/30 ring-1 ring-white/20 hover:shadow-xl transition-all hover:scale-105"
              >
                <VialIcon className="w-6 h-6" />
                <span className="text-[9px] mt-0.5 font-medium">List</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Threads Menu Dropdown - slides up from button */}
      {showCommunityMenu && (
        <>
          <div className="md:hidden fixed inset-0 z-50" onClick={() => setShowCommunityMenu(false)} />
          <div className="md:hidden fixed bottom-[5rem] right-[16.666%] z-50 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleCommunityOption('sys')}
                className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow-lg shadow-emerald-500/40 ring-1 ring-white/30 hover:shadow-xl transition-all hover:scale-105"
              >
                <ChatIcon className="w-6 h-6" />
                <span className="text-[9px] mt-0.5 font-medium">Threads</span>
              </button>
              <button
                onClick={() => handleCommunityOption('community')}
                className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-white/20 hover:shadow-xl transition-all hover:scale-105"
              >
                <MoleculeIcon className="w-6 h-6" />
                <span className="text-[9px] mt-0.5 font-medium">Peptides</span>
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
                    ? 'text-white bg-gradient-to-br from-emerald-500 to-lime-500 shadow-md shadow-emerald-500/30'
                    : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40'
                  : isHighlight
                    ? 'text-emerald-600 dark:text-emerald-400'
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
