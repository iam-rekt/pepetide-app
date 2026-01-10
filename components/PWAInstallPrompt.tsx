'use client';

import { useState, useEffect } from 'react';
import { X, Share, Plus, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed as PWA
        const standalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone === true;
        setIsStandalone(standalone);

        // Check if iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(iOS);

        // Check if dismissed recently (within 7 days)
        const dismissed = localStorage.getItem('pwa-prompt-dismissed');
        if (dismissed) {
            const dismissedDate = new Date(dismissed);
            const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) {
                return;
            }
        }

        // Listen for beforeinstallprompt (Chrome/Edge/Android)
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // Show iOS prompt after a delay if on iOS and not standalone
        if (iOS && !standalone) {
            const timer = setTimeout(() => {
                setShowPrompt(true);
            }, 3000);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            };
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
    };

    // Don't show if already installed or no prompt needed
    if (!showPrompt || isStandalone) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300 sm:left-auto sm:right-4 sm:max-w-sm">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5">
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Dismiss"
                >
                    <X className="w-5 h-5 text-slate-500" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                        <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                            Install PEPEtide
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Get the full app experience
                        </p>
                    </div>
                </div>

                {/* Benefits */}
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1 mb-4">
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                        Works offline
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                        Faster loading
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                        Push notifications
                    </li>
                </ul>

                {/* iOS Instructions */}
                {isIOS && !deferredPrompt && (
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 mb-4">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                            To install on iPhone/iPad:
                        </p>
                        <ol className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                            <li className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold">1</span>
                                Tap <Share className="w-4 h-4 inline text-blue-500" /> Share button
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold">2</span>
                                Scroll and tap <Plus className="w-4 h-4 inline" /> Add to Home Screen
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold">3</span>
                                Tap Add to confirm
                            </li>
                        </ol>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                    {deferredPrompt ? (
                        <Button
                            onClick={handleInstall}
                            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Install Now
                        </Button>
                    ) : (
                        <Button
                            onClick={handleDismiss}
                            variant="outline"
                            className="flex-1"
                        >
                            Got it!
                        </Button>
                    )}
                </div>

                {/* Not now link */}
                <button
                    onClick={handleDismiss}
                    className="w-full mt-2 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                    Maybe later
                </button>
            </div>
        </div>
    );
}
