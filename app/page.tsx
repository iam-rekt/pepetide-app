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
import Governance from '@/components/Governance';
import { PepetideMark, ScrollIcon } from '@/components/icons';
import ScrambleText from '@/components/ScrambleText';
import WalletButton from '@/components/WalletButton';
import { startMissedDoseChecker } from '@/lib/notifications';
import type { ViewMode } from '@/types';

const HOME_BG_DESKTOP = '/imagesnew/pepetide xyz home.webp';
const HOME_BG_MOBILE = '/imagesnew/Pepetide xyz home mobile.webp';

const backgroundByView: Partial<Record<ViewMode, { desktop: string; mobile: string }>> = {
  dashboard: { desktop: HOME_BG_DESKTOP, mobile: HOME_BG_MOBILE },
  calendar: {
    desktop: '/imagesnew/Pepetide xyz cal.webp',
    mobile: '/imagesnew/Pepetide calendar mobile.webp',
  },
  protocol: {
    desktop: '/imagesnew/Peptide kitchen.webp',
    mobile: '/imagesnew/Peptide kitchen mobile.webp',
  },
  sys: {
    desktop: '/imagesnew/Pepetide evo.webp',
    mobile: '/imagesnew/Pepetide evo mobile.webp',
  },
  settings: {
    desktop: '/imagesnew/Pepetide babe.webp',
    mobile: '/imagesnew/Pepetide babe mobile.webp',
  },
  governance: {
    desktop: '/imagesnew/Pepetide evo.webp',
    mobile: '/imagesnew/Pepetide evo mobile.webp',
  },
};

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
  'governance',
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
  // Always initialize to 'dashboard' so server + client first render match;
  // the popstate effect below syncs from the URL after mount.
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
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

  const bgImages = backgroundByView[currentView] ?? {
    desktop: HOME_BG_DESKTOP,
    mobile: HOME_BG_MOBILE,
  };

  return (
    <div className="relative min-h-screen pb-safe">
      {/* Per-section background — desktop (landscape source) */}
      <div
        key={`${bgImages.desktop}-d`}
        className="fixed inset-0 pointer-events-none z-0 bg-no-repeat bg-center bg-cover opacity-40 transition-opacity duration-500 hidden md:block"
        style={{ backgroundImage: `url("${encodeURI(bgImages.desktop)}")` }}
        aria-hidden="true"
      />
      {/* Per-section background — mobile (portrait source) */}
      <div
        key={`${bgImages.mobile}-m`}
        className="fixed inset-0 pointer-events-none z-0 bg-no-repeat bg-center bg-cover opacity-40 transition-opacity duration-500 md:hidden"
        style={{ backgroundImage: `url("${encodeURI(bgImages.mobile)}")` }}
        aria-hidden="true"
      />
      {/* Tonal unifier: low-opacity emerald wash so all section bgs share the same color tone */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-lime-500/10 mix-blend-overlay"
        aria-hidden="true"
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pepe-blink {
            0%, 49% { opacity: 1; transform: scale(1); }
            50%, 100% { opacity: 0.15; transform: scale(0.85); }
          }
          .animate-pepe-blink { animation: pepe-blink 1.1s steps(1) infinite; }
        `
      }} />
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-6xl">
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-3">
              <PepetideMark className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-[0_4px_12px_rgba(34,197,94,0.45)]" />
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-br from-emerald-400 via-green-500 to-lime-500 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(34,197,94,0.35)]">
                PEPEtide
              </h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <a
                href="https://docs.pepetide.xyz/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/50 bg-white/70 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm backdrop-blur-md transition-all hover:border-emerald-400 hover:bg-white/90 dark:border-emerald-500/30 dark:bg-slate-900/60 dark:text-emerald-200 dark:hover:border-emerald-400/60"
                aria-label="Open PEPEtide documentation"
              >
                <ScrollIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Docs</span>
              </a>
              <WalletButton />
            </div>
            <p className="flex items-center gap-2 text-[11px] sm:text-xs font-mono tracking-tight text-slate-700 dark:text-slate-300 max-w-full">
              <span
                className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.7)] animate-pepe-blink shrink-0"
                aria-hidden="true"
              />
              <ScrambleText text="Private peptide tracking with decentralized anonymous Threads for Peptards." />
            </p>
          </div>
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
          {currentView === 'governance' && <Governance key="governance" />}
          {currentView === 'sys' && <ForumView key="sys" />}
          {currentView === 'settings' && <Settings key="settings" />}
        </main>
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}
