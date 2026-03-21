'use client';

import { useState, useCallback, useEffect } from 'react';
import Dashboard from '@/components/Dashboard';
import AddStack from '@/components/AddStack';
import PeptideList from '@/components/PeptideList';
import Calculator from '@/components/Calculator';
import CalendarView from '@/components/CalendarView';
import ProtocolBuilder from '@/components/ProtocolBuilder';
import CommunityView from '@/components/CommunityView';
import ForumView from '@/components/ForumView';
import Settings from '@/components/Settings';
import Navigation from '@/components/Navigation';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import { startMissedDoseChecker } from '@/lib/notifications';
import type { ViewMode } from '@/types';

const validViews = new Set<ViewMode>([
  'dashboard',
  'add-stack',
  'my-list',
  'calculator',
  'calendar',
  'protocol',
  'community',
  'settings',
  'sys',
]);

function getViewFromSearch(search: string): ViewMode {
  const params = new URLSearchParams(search);
  const requestedView = params.get('view');

  if (requestedView && validViews.has(requestedView as ViewMode)) {
    return requestedView as ViewMode;
  }

  return 'dashboard';
}

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') {
      return 'dashboard';
    }

    return getViewFromSearch(window.location.search);
  });
  const [protocolKey, setProtocolKey] = useState(0);

  // Start client-side notification checker
  useEffect(() => {
    const cleanup = startMissedDoseChecker();
    return cleanup;
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const nextView = getViewFromSearch(window.location.search);

      if (nextView === 'protocol') {
        setProtocolKey((prev) => prev + 1);
      }

      setCurrentView(nextView);
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Wrapper to track view changes and increment protocol key when navigating to it
  const handleViewChange = useCallback((newView: ViewMode) => {
    if (newView === 'protocol') {
      setProtocolKey(prev => prev + 1);
    }

    const params = new URLSearchParams(window.location.search);

    if (newView === 'dashboard') {
      params.delete('view');
    } else {
      params.set('view', newView);
    }

    const nextUrl = params.toString() ? `/?${params.toString()}` : '/';
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (currentUrl !== nextUrl) {
      window.history.pushState({ view: newView }, '', nextUrl);
    }

    setCurrentView(newView);
  }, []);

  return (
    <div className="min-h-screen pb-safe">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-6xl">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2">
            PEPEtide
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Private peptide tracking with anonymous Threads when you want to ask, share, or update.
          </p>
        </header>

        <Navigation currentView={currentView} onViewChange={handleViewChange} />

        <main className="mt-4 sm:mt-6 pb-20 md:pb-4">
          {currentView === 'dashboard' && <Dashboard key="dashboard" onNavigate={handleViewChange} />}
          {currentView === 'add-stack' && <AddStack key="add-stack" onBack={() => handleViewChange('dashboard')} onComplete={() => handleViewChange('dashboard')} />}
          {currentView === 'my-list' && <PeptideList key="my-list" onNavigate={handleViewChange} />}
          {currentView === 'protocol' && <ProtocolBuilder key={`protocol-${protocolKey}`} onComplete={() => handleViewChange('calendar')} onNavigate={handleViewChange} />}
          {currentView === 'calculator' && <Calculator key="calculator" />}
          {currentView === 'calendar' && <CalendarView key="calendar" onNavigate={handleViewChange} />}
          {currentView === 'community' && <CommunityView key="community" />}
          {currentView === 'sys' && <ForumView key="sys" />}
          {currentView === 'settings' && <Settings key="settings" />}
        </main>
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}
